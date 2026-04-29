package com.nolocardeno.backend.service.processing;

import com.nolocardeno.backend.dto.processing.ExtractionLineItem;
import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionSource;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import com.nolocardeno.backend.dto.processing.FieldConfidence;
import com.nolocardeno.backend.model.enums.DocumentType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Heuristic parser for OCR plain text. By design, its confidence is capped
 * below the primary threshold so the frontend flags the result for manual
 * review. Not a replacement for the AI extractor — only a safety net.
 */
@Component
@Slf4j
public class OcrTextParser {

    private static final double MAX_OCR_CONFIDENCE = 0.6;

    private static final Pattern DATE = Pattern.compile(
            // Day, month, then either a 4-digit year that starts with 19/20
            // (no trailing-boundary requirement, so "07/02/201314:25" still
            // matches when PaddleOCR glues the date to the receipt's time)
            // OR a 2-digit year that must NOT be followed by another digit.
            "\\b(\\d{1,2})[/.\\-](\\d{1,2})[/.\\-]((?:19|20)\\d{2}|\\d{2}(?!\\d))");
    /**
     * Date with a textual month (Spanish or English), e.g. "07/Jun/2012",
     * "7 de junio de 2012", "07-JUN-2012". Case-insensitive. Years must be
     * 19xx/20xx so we don't grab random numbers.
     */
    private static final Pattern TEXT_MONTH_DATE = Pattern.compile(
            "(?i)(?<![0-9])(\\d{1,2})[\\s./\\-]{0,4}(?:de\\s+)?"
            + "(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|"
            + "jul(?:io)?|ago(?:sto)?|sep(?:tiembre|t)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?|"
            + "jan(?:uary)?|february|march|april|june|july|august|september|october|november|december)"
            + "[\\s./\\-]{0,4}(?:de\\s+)?(19\\d{2}|20\\d{2})(?![0-9])");
    /**
     * OCR-tolerant date used by Spanish ID cards, e.g. "08 03 2023".
     * Allows any mix of spaces / dots / dashes / slashes between parts and
     * swallows up to two stray non-digit characters between groups (the OCR
     * often inserts `.`, `,`, or spurious letters). Years must be 19xx/20xx
     * so we don't grab random 4-digit run-offs.
     */
    private static final Pattern SPACED_DATE = Pattern.compile(
            "(?<![0-9])(\\d{1,2})[\\s./\\-,]{1,3}(\\d{1,2})[\\s./\\-,]{1,3}(19\\d{2}|20\\d{2})(?![0-9])");
    /**
     * 8-digit contiguous DDMMYYYY block, e.g. {@code 20022023}. PaddleOCR
     * sometimes drops the spaces inside Spanish passport / DNI dates and
     * emits a single 8-digit run, which {@link #DATE} and {@link #SPACED_DATE}
     * miss because they require a separator. We restrict the year to
     * 19xx/20xx and the month to 01-12 to avoid matching unrelated 8-digit
     * IDs (passport numbers always have at least one letter, so they don't
     * trip this pattern).
     */
    private static final Pattern DDMMYYYY_BLOCK = Pattern.compile(
            "(?<!\\d)(\\d{2})(0[1-9]|1[0-2])((?:19|20)\\d{2})(?!\\d)");
    private static final Pattern AMOUNT = Pattern.compile(
            "(?i)(?:total|importe|amount|a\\s*pagar|tot\\.)[^\\d-]*(\\d+[.,]\\d{2})");
    private static final Pattern ANY_AMOUNT = Pattern.compile(
            "(?<![\\d.,])(\\d{1,4}[.,]\\d{2})(?:\\s*(?:\u20ac|eur|euros?))?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DNI_NUM = Pattern.compile("\\b\\d{8}[A-Z]\\b");
    /** Spanish plate format: 4 digits + 3 consonants (no vowels, no Ñ/Q). */
    private static final Pattern PLATE = Pattern.compile(
            "\\b\\d{4}\\s?[BCDFGHJKLMNPRSTVWXYZ]{3}\\b");
    private static final Pattern ITV_KEYWORD = Pattern.compile(
            "(?i)\\b(itv|inspecci[oó]n\\s+t[eé]cnica)\\b");
    private static final Pattern EXPIRY_LABEL = Pattern.compile(
            "(?i)(caducidad|caduca|valid[oa]?\\s+hasta|expir[ae]?|expiry|expires?|vence|valid\\s+until|validez|date\\s+of\\s+expir[yi]|date\\s+of\\s+expiration)\\s*[:\\-]?\\s*"
            + "(\\d{1,2}[/.\\-\\s]{1,3}\\d{1,2}[/.\\-\\s]{1,3}\\d{2,4})");
    private static final Pattern ISSUE_LABEL_DNI = Pattern.compile(
            "(?i)(emisi[oó]n|expedici[oó]n|date\\s+of\\s+issue|date\\s+of\\s+deliverance)\\s*[:\\-]?\\s*"
            + "(\\d{1,2}[/.\\-\\s]{1,3}\\d{1,2}[/.\\-\\s]{1,3}\\d{2,4})");
    /**
     * Spanish driving license labels per Annex I of EU Directive 2006/126/EC:
     * field {@code 4a.} is the issue date, {@code 4b.} is the expiry date.
     * These are printed without any descriptive text, so we anchor on the
     * field number itself. Using line start (or a non-digit boundary) avoids
     * grabbing the trailing year of the previous date.
     */
    private static final Pattern DL_FIELD_4A = Pattern.compile(
            "(?im)(?:^|[^0-9a-z])4\\s*a\\s*[.:\\-]?\\s*"
            + "(\\d{1,2}[/.\\-\\s]{1,3}\\d{1,2}[/.\\-\\s]{1,3}\\d{2,4})");
    private static final Pattern DL_FIELD_4B = Pattern.compile(
            "(?im)(?:^|[^0-9a-z])4\\s*b\\s*[.:\\-]?\\s*"
            + "(\\d{1,2}[/.\\-\\s]{1,3}\\d{1,2}[/.\\-\\s]{1,3}\\d{2,4})");
    /**
     * Spanish/ICAO passport field numbering:
     *   (7) Fecha de expedición / Date of issue
     *   (8) Fecha de caducidad  / Date of expiry
     * The label line is followed by translations in two more languages
     * AND the actual date is printed below on a separate line, so a strict
     * "label + date" regex fails. Instead, anchor on the field number and
     * scan the next ~80 characters (covers the translated labels plus the
     * line break) for the first plausible date.
     */
    private static final Pattern PASSPORT_FIELD_7 = Pattern.compile(
            "(?is)\\(\\s*7\\s*\\).{0,80}?"
            + "(\\d{1,2}[/.\\-\\s]{1,3}\\d{1,2}[/.\\-\\s]{1,3}(?:19|20)\\d{2})");
    private static final Pattern PASSPORT_FIELD_8 = Pattern.compile(
            "(?is)\\(\\s*8\\s*\\).{0,80}?"
            + "(\\d{1,2}[/.\\-\\s]{1,3}\\d{1,2}[/.\\-\\s]{1,3}(?:19|20)\\d{2})");
    /**
     * 6-digit DDMMYY block printed on Spanish DNI 3.0 near NUM SOPORTE,
     * e.g. "080323" = 08/03/2023 = emission date. Kept separate so we only
     * apply it as a last resort for DNI documents.
     */
    private static final Pattern DDMMYY_BLOCK = Pattern.compile("(?<![0-9])(\\d{6})(?![0-9])");

    /**
     * Passport MRZ opening: "P<" + 3-letter country code. Appears at the
     * start of the 2-line machine-readable zone on any ICAO passport.
     * Case-insensitive because the OCR sometimes lowercases it.
     */
    private static final Pattern PASSPORT_MRZ = Pattern.compile(
            "(?i)P\\s*<\\s*[A-Z]{3}");

    /**
     * ICAO TD3 MRZ line 2 fragment that anchors birth and expiry dates at
     * fixed positions. After the 9-char passport#, check digit and 3-char
     * nationality we have: YYMMDD(birth) + check + sex + YYMMDD(expiry) + check.
     * We scan for any 3-letter nationality code immediately followed by
     * 6 digits + digit + sex letter + 6 digits + digit, which is very
     * distinctive and survives most OCR noise on the rest of the line.
     *
     * `O` and `0` are frequently swapped by OCR, and `<` is sometimes read
     * as a letter, so we keep the pattern strict on the date/check digits
     * but accept `[A-Z0-9<]` for the country slot (OCR occasionally swaps
     * a `0` into `O` here too, but the date windows remain reliable).
     */
    private static final Pattern MRZ_DATES = Pattern.compile(
            "[A-Z<][A-Z0-9<]{2}(\\d{6})[0-9O](?:[MFmf<])(\\d{6})[0-9O]");

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yy"),
    };

    public ExtractionResult parse(String text) {
        DocumentType type = classify(text);
        boolean isOfficial = type == DocumentType.DNI
                || type == DocumentType.PASSPORT
                || type == DocumentType.DRIVING_LICENSE
                || type == DocumentType.ITV;

        LocalDate issue;
        LocalDate expiry;
        if (isOfficial) {
            // For PASSPORT, the MRZ line is a machine-readable source of
            // truth (fixed positions, OCR-friendly font) that beats the
            // noisy printed area. Try it first: it gives us expiry, and
            // Spanish adult passports have a 10-year validity so we can
            // derive the issue date if the printed one is unreadable.
            LocalDate mrzExpiry = type == DocumentType.PASSPORT
                    ? findPassportMrzExpiry(text) : null;

            // Spanish ID/passport/DL cards use labelled, space-separated dates
            // (e.g. "EMISIÓN 08 03 2023", "VALIDEZ 08 03 2028"). Prefer labels.
            issue = findIssueDateOfficial(text);
            expiry = findExpiryDate(text);

            // MRZ overrides the printed expiry: if both exist but differ and
            // the MRZ one is plausibly close to today, trust the MRZ.
            if (mrzExpiry != null) {
                if (expiry == null
                        || !expiry.equals(mrzExpiry)) {
                    expiry = mrzExpiry;
                }
            }
            if (issue == null || expiry == null) {
                // Fallback anchored on today's date: official IDs always have
                // - an issue date in the past (within ~15y window for current
                //   DNI/DL cycles)
                // - an expiry date in the future (or very recently elapsed)
                // This filters out birth dates and per-category DL dates,
                // which were the main source of swapped issue/expiry values.
                LocalDate today = LocalDate.now();
                java.util.List<LocalDate> all = findAllSpacedDates(text);
                LocalDate bestIssue = null;
                LocalDate bestExpiry = null;
                // When the expiry is already known (e.g. from the passport
                // MRZ), the issue date must be strictly before it. This
                // prevents picking the printed expiry as issue when both
                // are in the past — e.g. on a passport scanned in 2026
                // with issue=2015-01-01 and expiry=2025-01-01, the naive
                // "most recent past date" rule would wrongly pick 2025.
                LocalDate issueUpperBound = expiry != null ? expiry : today;
                for (LocalDate d : all) {
                    int yearsFromToday = Math.abs(d.getYear() - today.getYear());
                    if (yearsFromToday > 25) continue; // drop birth dates / decorations
                    if (d.isBefore(issueUpperBound)) {
                        // Past (and strictly before any known expiry) ->
                        // candidate for issue. Prefer the most recent.
                        if (bestIssue == null || d.isAfter(bestIssue)) {
                            bestIssue = d;
                        }
                    } else if (d.isAfter(today)) {
                        // Future -> candidate for expiry. Prefer the latest one
                        // (driving licenses list multiple per-category expiries;
                        // the document-level expiry is always the latest).
                        if (bestExpiry == null || d.isAfter(bestExpiry)) {
                            bestExpiry = d;
                        }
                    }
                }
                if (issue == null)  issue = bestIssue;
                if (expiry == null) expiry = bestExpiry;
            }
            // Spanish passports have a variable validity (5 years for
            // under-30 holders, 10 years otherwise), so we MUST NOT derive
            // the issue date from the expiry by subtracting a fixed offset:
            // a 27-year-old applicant gets a 5-year passport, and assuming
            // 10 years would silently report the wrong issue date. If the
            // OCR couldn't read one of the two dates, leave it null and let
            // the user fill it in manually rather than show a fabricated
            // date.

            // Sanity: an issue date that is after the expiry date is always
            // wrong (regardless of document type) — discard it.
            if (issue != null && expiry != null && issue.isAfter(expiry)) {
                issue = null;
            }
            // Last-resort fallback for DNI: the 6-digit DDMMYY block printed
            // under NUM SOPORTE encodes the emission date. Spanish DNI 3.0
            // adult validity is 10 years — use that to derive expiry.
            if (type == DocumentType.DNI && issue == null) {
                issue = findDdmmyyEmissionDate(text);
                if (issue != null && expiry == null) {
                    expiry = issue.plusYears(10);
                }
            }
        } else {
            issue = findFirstDate(text);
            expiry = findExpiryDate(text);
        }

        BigDecimal amount = isOfficial ? null : findAmount(text);
        // Official documents have no "merchant" — avoid picking up OCR garbage
        // from card decorations as a store name.
        String merchant = isOfficial ? null : findMerchant(text);
        // Detect receipt-category keywords (devolucion / garantia) so the
        // pipeline can reuse the same logic the AI extractor would trigger.
        String receiptCategory = isOfficial ? null : findReceiptCategory(text);
        // Extract the holder's given name on official documents so the
        // pipeline can build a personalised title ("DNI - Manolo") instead
        // of the bare type label, mirroring what the AI extractor does.
        String holderName = isOfficial ? findHolderName(text, type) : null;

        log.info("OCR parsed: type={} issue={} expiry={} amount={} merchant={}",
                type, issue, expiry, amount, merchant);
        log.info("OCR raw text (type={}):\n{}", type, text);

        Map<String, FieldConfidence> confidences = new HashMap<>();
        if (type != DocumentType.OTHER) confidences.put("detectedType", FieldConfidence.of(0.55));
        if (issue != null)              confidences.put("issueDate",    FieldConfidence.of(0.5));
        if (expiry != null)             confidences.put("expiryDate",   FieldConfidence.of(0.55));
        if (merchant != null)           confidences.put("merchant",     FieldConfidence.of(0.45));
        if (amount != null)             confidences.put("totalAmount",  FieldConfidence.of(0.5));

        double overall = computeOverall(confidences);
        // If OCR produced any text but no fields matched, keep a minimal
        // non-zero confidence so the pipeline still returns LOW_CONFIDENCE
        // and a document is persisted for manual review.
        if (overall <= 0 && text != null && !text.isBlank()) {
            overall = 0.2;
        }
        ExtractionStatus status = overall <= 0
                ? ExtractionStatus.FAILED
                : ExtractionStatus.LOW_CONFIDENCE;

        return new ExtractionResult(
                status,
                ExtractionSource.OCR,
                type,
                issue,
                expiry,
                merchant,
                amount,
                "EUR",
                List.<ExtractionLineItem>of(),
                confidences,
                overall,
                text,
                holderName,
                receiptCategory
        );
    }

    private DocumentType classify(String text) {
        String s = text.toLowerCase(Locale.ROOT);
        // Accent- and case-insensitive copy for keyword matching. OCR often
        // drops accents (e.g. "conducción" → "conduccion") and we don't want
        // to miss matches because of a lost diacritic.
        String n = stripAccents(s);

        // Retailer/clothing brands strongly imply RECEIPT and override any
        // accidental keyword match (e.g. ITV inside "4-digit+3-letter" runs).
        if (isKnownRetailer(s)) return DocumentType.RECEIPT;

        // Passport: MRZ line starts with "P<ESP" or similar; or the literal
        // word "pasaporte" / "passport"; or a passport number format like
        // "PAQ169870" (3 letters + 6 digits) near the word "passport".
        if (n.contains("pasaporte") || n.contains("passport")
                || PASSPORT_MRZ.matcher(text).find()) {
            return DocumentType.PASSPORT;
        }
        // Driving license: accent-insensitive "permiso de conduccion",
        // "permiso de conducir", "driving licence/license". PaddleOCR often
        // glues short words ("permiso de" → "permisode"), so we match on a
        // whitespace-tolerant regex rather than literal substrings.
        if (Pattern.compile("(?i)permiso\\s*de\\s*conduc(cion|ir)").matcher(n).find()
                || n.contains("driving licence") || n.contains("driving license")
                || n.contains("driving permit")) {
            return DocumentType.DRIVING_LICENSE;
        }
        if (DNI_NUM.matcher(text).find() || n.contains("documento nacional")) return DocumentType.DNI;
        // ITV requires an explicit keyword OR a plate AND an ITV-related term.
        if (ITV_KEYWORD.matcher(text).find() || PLATE.matcher(text).find()) return DocumentType.ITV;
        if (n.contains("poliza") || n.contains("seguro"))                    return DocumentType.INSURANCE;
        if (n.contains("factura") || n.contains("invoice"))                  return DocumentType.INVOICE;
        // Receipt signals: keyword, total labels, IVA, euro sign, well-known retail chains.
        boolean receiptSignals =
                s.contains("ticket")
                || s.contains("total")
                || s.contains("subtotal")
                || s.contains("i.v.a") || s.contains(" iva ") || s.contains("iva ")
                || s.contains("efectivo") || s.contains("tarjeta")
                || s.contains("\u20ac") || s.contains(" eur ")
                || AMOUNT.matcher(text).find();
        if (receiptSignals) return DocumentType.RECEIPT;
        return DocumentType.OTHER;
    }

    private static final java.util.List<String> CLOTHING_BRANDS = java.util.List.of(
            "zara home", "zara", "mango", "bershka", "stradivarius", "pull&bear", "pull & bear",
            "pull and bear", "massimo dutti", "oysho", "h&m", "h & m", "h and m",
            "primark", "lefties", "shana", "springfield", "cortefiel",
            "desigual", "uniqlo", "kiabi", "decathlon"
    );

    private static final java.util.List<String> OTHER_RETAILERS = java.util.List.of(
            "mercadona", "carrefour", "lidl", "dia", "alcampo", "eroski",
            "caprabo", "consum", "bonpreu", "hiperdino", "ahorramas",
            "ikea", "leroy merlin", "media markt", "mediamarkt", "fnac",
            "worten", "el corte inglés", "el corte ingles"
    );

    /**
     * Subset of {@link #OTHER_RETAILERS} that sells everyday groceries /
     * consumables. Used both for {@code receiptCategory = "consumo"} and
     * to mirror the AI extractor's category mapping.
     */
    private static final java.util.List<String> GROCERY_RETAILERS = java.util.List.of(
            "mercadona", "carrefour", "lidl", "dia", "alcampo", "eroski",
            "caprabo", "consum", "bonpreu", "hiperdino", "ahorramas"
    );

    private boolean isKnownRetailer(String lower) {
        for (String b : CLOTHING_BRANDS) if (containsWord(lower, b)) return true;
        for (String b : OTHER_RETAILERS) if (containsWord(lower, b)) return true;
        return false;
    }

    /** Returns true if text mentions a known clothing retailer. */
    public static boolean looksLikeClothing(String text) {
        if (text == null) return false;
        String s = text.toLowerCase(Locale.ROOT);
        for (String b : CLOTHING_BRANDS) if (containsWord(s, b)) return true;
        return false;
    }

    /**
     * Word-boundary aware `contains`. Prevents "dia" matching inside
     * "CLAUDIA" or "zara" matching inside "bizarra". Treats anything
     * that is not a letter/digit as a boundary, so ampersands in brands
     * like "h&m" still work.
     */
    private static boolean containsWord(String haystack, String needle) {
        if (needle == null || needle.isEmpty()) return false;
        int from = 0;
        while (from <= haystack.length() - needle.length()) {
            int idx = haystack.indexOf(needle, from);
            if (idx < 0) return false;
            char before = idx == 0 ? ' ' : haystack.charAt(idx - 1);
            int afterIdx = idx + needle.length();
            char after = afterIdx >= haystack.length() ? ' ' : haystack.charAt(afterIdx);
            if (!Character.isLetterOrDigit(before) && !Character.isLetterOrDigit(after)) {
                return true;
            }
            from = idx + 1;
        }
        return false;
    }

    /** Removes accents/diacritics so OCR output without them still matches. */
    private static String stripAccents(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }

    private LocalDate findFirstDate(String text) {
        // Collect every numeric date in the ticket and pick the most
        // plausible "purchase date". Receipts can include unrelated dates
        // (validity of an offer, expiry of a product, support phone hours
        // formatted as "9.00-21.00" that DATE thankfully ignores). The
        // purchase date is almost always the most recent past date that
        // is not in the future, so we apply that rule globally.
        java.util.List<LocalDate> all = new java.util.ArrayList<>();
        Matcher m = DATE.matcher(text);
        while (m.find()) {
            LocalDate d = tryParseDate(m.group());
            if (d != null) all.add(d);
        }
        Matcher tm = TEXT_MONTH_DATE.matcher(text);
        while (tm.find()) {
            LocalDate d = parseTextMonthDate(tm.group(1), tm.group(2), tm.group(3));
            if (d != null) all.add(d);
        }
        if (all.isEmpty()) return null;
        LocalDate today = LocalDate.now();
        LocalDate best = null;
        for (LocalDate d : all) {
            // Keep only sensible receipt years to filter junk (e.g. an OCR
            // mis-read producing 1900 or 2099). Receipts older than 30 years
            // are vanishingly rare; future dates are usually offer/validity
            // copy, not the purchase date.
            if (d.getYear() < today.getYear() - 30) continue;
            if (d.isAfter(today)) continue;
            if (best == null || d.isAfter(best)) best = d;
        }
        // If every candidate was filtered out (e.g. a future-dated test
        // image), fall back to the first parsed date so we still return
        // something rather than null.
        return best != null ? best : all.get(0);
    }

    private LocalDate parseTextMonthDate(String dayStr, String monthName, String yearStr) {
        int day, year, month;
        try {
            day = Integer.parseInt(dayStr);
            year = Integer.parseInt(yearStr);
        } catch (NumberFormatException e) {
            return null;
        }
        String m = monthName.toLowerCase(Locale.ROOT);
        if (m.startsWith("ene") || m.startsWith("jan")) month = 1;
        else if (m.startsWith("feb")) month = 2;
        else if (m.startsWith("mar")) month = 3;
        else if (m.startsWith("abr") || m.startsWith("apr")) month = 4;
        else if (m.startsWith("may")) month = 5;
        else if (m.startsWith("jun")) month = 6;
        else if (m.startsWith("jul")) month = 7;
        else if (m.startsWith("ago") || m.startsWith("aug")) month = 8;
        else if (m.startsWith("sep")) month = 9;
        else if (m.startsWith("oct")) month = 10;
        else if (m.startsWith("nov")) month = 11;
        else if (m.startsWith("dic") || m.startsWith("dec")) month = 12;
        else return null;
        try {
            return LocalDate.of(year, month, day);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate findExpiryDate(String text) {
        // Driving licenses use the structured "4b" label, which is far more
        // reliable than free-text "caducidad". Try it first.
        Matcher dl = DL_FIELD_4B.matcher(text);
        if (dl.find()) {
            LocalDate d = tryParseDate(dl.group(1));
            if (d != null) return d;
        }
        // Spanish passport field (8) = expiry. Survives multi-language label
        // text and OCR line breaks better than free-text matching.
        Matcher pp = PASSPORT_FIELD_8.matcher(text);
        if (pp.find()) {
            LocalDate d = tryParseDate(pp.group(1));
            if (d != null) return d;
        }
        Matcher m = EXPIRY_LABEL.matcher(text);
        if (m.find()) {
            LocalDate d = tryParseDate(m.group(m.groupCount()));
            if (d != null) return d;
        }
        return null;
    }

    private LocalDate findIssueDateOfficial(String text) {
        // Driving licenses: "4a" label (issue date).
        Matcher dl = DL_FIELD_4A.matcher(text);
        if (dl.find()) {
            LocalDate d = tryParseDate(dl.group(1));
            if (d != null) return d;
        }
        // Spanish passport field (7) = issue.
        Matcher pp = PASSPORT_FIELD_7.matcher(text);
        if (pp.find()) {
            LocalDate d = tryParseDate(pp.group(1));
            if (d != null) return d;
        }
        Matcher m = ISSUE_LABEL_DNI.matcher(text);
        if (m.find()) {
            LocalDate d = tryParseDate(m.group(m.groupCount()));
            if (d != null) return d;
        }
        return null;
    }

    private java.util.List<LocalDate> findAllSpacedDates(String text) {
        java.util.List<LocalDate> out = new java.util.ArrayList<>();
        Matcher m = SPACED_DATE.matcher(text);
        while (m.find()) {
            LocalDate d = tryParseDate(m.group(1) + "/" + m.group(2) + "/" + m.group(3));
            if (d != null) out.add(d);
        }
        // Also accept the slash/dash/dot variant (DATE pattern) so we don't
        // miss dates that the OCR rendered with punctuation instead of spaces.
        Matcher m2 = DATE.matcher(text);
        while (m2.find()) {
            LocalDate d = tryParseDate(m2.group());
            if (d != null && !out.contains(d)) out.add(d);
        }
        // Contiguous 8-digit DDMMYYYY: PaddleOCR tends to strip the spaces
        // out of Spanish passport / DNI dates, so "20 02 2023" arrives as
        // "20022023". Without this, none of the patterns above match.
        Matcher m3 = DDMMYYYY_BLOCK.matcher(text);
        while (m3.find()) {
            LocalDate d = tryParseDate(m3.group(1) + "/" + m3.group(2) + "/" + m3.group(3));
            if (d != null && !out.contains(d)) out.add(d);
        }
        return out;
    }

    /**
     * Find the 6-digit DDMMYY block printed under NUM SOPORTE on Spanish DNI
     * 3.0, which encodes the emission date. Accepts any such block that
     * parses as a plausible emission date (between 2006 and today).
     */
    private LocalDate findDdmmyyEmissionDate(String text) {
        LocalDate today = LocalDate.now();
        LocalDate minDate = LocalDate.of(2006, 1, 1); // DNI 3.0 rollout baseline
        Matcher m = DDMMYY_BLOCK.matcher(text);
        while (m.find()) {
            String raw = m.group(1);
            int dd, mm, yy;
            try {
                dd = Integer.parseInt(raw.substring(0, 2));
                mm = Integer.parseInt(raw.substring(2, 4));
                yy = Integer.parseInt(raw.substring(4, 6));
            } catch (NumberFormatException ignored) {
                continue;
            }
            if (dd < 1 || dd > 31 || mm < 1 || mm > 12) continue;
            int year = 2000 + yy; // DNIs are post-2000
            LocalDate candidate;
            try {
                candidate = LocalDate.of(year, mm, dd);
            } catch (Exception ignored) {
                continue;
            }
            if (!candidate.isBefore(minDate) && !candidate.isAfter(today)) {
                return candidate;
            }
        }
        return null;
    }

    /**
     * Parse the expiry date from the passport MRZ line (ICAO TD3).
     * The MRZ uses fixed offsets and a constrained font, making it far
     * more OCR-reliable than the printed date labels. The 6-digit expiry
     * block is YYMMDD; passports expire in the future, so treat YY as 20YY.
     */
    private LocalDate findPassportMrzExpiry(String text) {
        if (text == null) return null;
        Matcher m = MRZ_DATES.matcher(text);
        while (m.find()) {
            String expRaw = m.group(2);
            LocalDate d = parseMrzYYMMDD(expRaw, true);
            if (d == null) continue;
            int y = d.getYear();
            if (y >= 2000 && y <= 2050) return d;
        }
        return null;
    }

    private LocalDate parseMrzYYMMDD(String raw, boolean futureCentury) {
        if (raw == null || raw.length() != 6) return null;
        int yy, mm, dd;
        try {
            yy = Integer.parseInt(raw.substring(0, 2));
            mm = Integer.parseInt(raw.substring(2, 4));
            dd = Integer.parseInt(raw.substring(4, 6));
        } catch (NumberFormatException e) {
            return null;
        }
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
        int year = futureCentury ? 2000 + yy : (yy >= 50 ? 1900 + yy : 2000 + yy);
        try {
            return LocalDate.of(year, mm, dd);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate tryParseDate(String raw) {
        String normalized = raw.trim()
                .replace('-', '/')
                .replace('.', '/')
                .replaceAll("\\s+", "/");
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try {
                return LocalDate.parse(normalized, fmt);
            } catch (Exception ignored) {
                // try next format
            }
        }
        return null;
    }

    private BigDecimal findAmount(String text) {
        Matcher m = AMOUNT.matcher(text);
        if (m.find()) {
            try {
                return new BigDecimal(m.group(1).replace(',', '.'));
            } catch (NumberFormatException e) {
                // fallthrough to any-amount search
            }
        }
        // Fallback: pick the largest decimal value in the text (commonly the TOTAL).
        BigDecimal max = null;
        Matcher any = ANY_AMOUNT.matcher(text);
        while (any.find()) {
            try {
                BigDecimal v = new BigDecimal(any.group(1).replace(',', '.'));
                if (max == null || v.compareTo(max) > 0) max = v;
            } catch (NumberFormatException ignored) {
                // skip malformed
            }
        }
        return max;
    }

    private String findMerchant(String text) {
        // Known-retailer match wins, BUT only when the brand appears near
        // the top of the ticket. Searching the whole text is dangerous:
        // product lines like "CAFE MOLIDO MEZCLA EROSKI" on a Caprabo
        // ticket would otherwise hijack the merchant. Receipt headers are
        // always within the first ~6 lines.
        String[] lines = text.split("\\r?\\n");
        int headerLines = Math.min(lines.length, 6);
        StringBuilder headerBuf = new StringBuilder();
        for (int i = 0; i < headerLines; i++) headerBuf.append(lines[i]).append('\n');
        String header = headerBuf.toString().toLowerCase(Locale.ROOT);
        for (String brand : CLOTHING_BRANDS) {
            if (containsWord(header, brand)) return brand.toUpperCase(Locale.ROOT);
        }
        for (String brand : OTHER_RETAILERS) {
            if (containsWord(header, brand)) return brand.toUpperCase(Locale.ROOT);
        }
        // Fallback: scan the top of the ticket for a plausible header line.
        int scanLimit = Math.min(lines.length, 10);
        String best = null;
        for (int i = 0; i < scanLimit; i++) {
            String t = lines[i].trim();
            // Strip decorative runs (======, -----, etc.) and trailing numbers.
            t = t.replaceAll("[=_\\-*]{2,}", " ").trim();
            if (t.length() < 3) continue;
            if (DATE.matcher(t).find()) continue;
            if (t.matches("[\\d\\s.,/\\-:]+")) continue;
            String low = t.toLowerCase(Locale.ROOT);
            // Skip lines that are clearly not the merchant name.
            if (low.startsWith("cif") || low.startsWith("nif")
                    || low.startsWith("tel") || low.contains("factura")
                    || low.contains("ticket") || low.contains("total")
                    || low.contains("subtotal") || low.contains("i.v.a")
                    || low.contains(" iva ") || low.contains("efectivo")
                    || low.contains("tarjeta")) {
                continue;
            }
            // Skip address lines so the merchant doesn't end up being a
            // street name. Spanish receipts very commonly print the address
            // immediately under the brand: "C/ Mayor 12", "Avda. Andalucia",
            // or a bare 5-digit postal code.
            if (low.startsWith("c/") || low.startsWith("c\\")
                    || low.startsWith("calle ") || low.startsWith("avda")
                    || low.startsWith("avenida ") || low.startsWith("plaza ")
                    || low.startsWith("pza") || low.startsWith("po\u00b0 ")
                    || low.startsWith("paseo ") || low.startsWith("ctra")
                    || low.matches("^\\d{5}\\b.*")) {
                continue;
            }
            // Require at least one letter.
            if (!t.matches(".*[A-Za-z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1].*")) {
                continue;
            }
            // Strip trailing short numeric codes (e.g. "CAPRABO - 2628" → "CAPRABO").
            String cleaned = t.replaceAll("\\s*[\\-\u2014]\\s*\\d+\\s*$", "").trim();
            if (cleaned.length() < 3) cleaned = t;
            best = cleaned;
            break;
        }
        if (best != null) return best.toUpperCase(Locale.ROOT);
        return null;
    }

    private double computeOverall(Map<String, FieldConfidence> confidences) {
        if (confidences.isEmpty()) return 0.0;
        double sum = confidences.values().stream().mapToDouble(FieldConfidence::score).sum();
        double avg = sum / confidences.size();
        return Math.min(avg, MAX_OCR_CONFIDENCE);
    }

    /**
     * Extract the document holder's given name (first name) from official
     * Spanish IDs. We mirror the AI extractor contract: only the first name
     * is returned (no surnames), so callers can build personal titles like
     * {@code "DNI - Manolo"}. Returns {@code null} when nothing reliable can
     * be parsed — better empty than wrong.
     *
     * Strategies, in order of confidence:
     *   1. ICAO MRZ line 1 ({@code P<ESPCARDENO<<MANOLO<<...}). The MRZ uses
     *      a fixed-width font that PaddleOCR reads almost perfectly, and the
     *      structure is unambiguous: surnames are followed by {@code <<} and
     *      then the given names.
     *   2. Spanish DNI / DL field (2) ({@code (2) Nombre / Given Names ...}).
     *      The next non-noise line after the label is the given name.
     */
    private String findHolderName(String text, DocumentType type) {
        if (text == null || text.isBlank()) return null;

        // Strategy 1 — MRZ. The opening "P<" + country-code prefix may have lost its "<"
        // through OCR noise (we've seen "PESPCARDENO<SANCHEZ<<MANOLO"), so
        // accept any "P[<]?[A-Z]{3}" then surnames "<<" given-names. We
        // intentionally don't pin the issuer to ESP because specimen
        // passports use UTO and other 3-letter codes are valid too.
        Matcher mrz = Pattern.compile(
                "(?m)\\bP[<\\s]?[A-Z]{3}[A-Z<]{0,40}?<<([A-Z][A-Z<\\s]+)"
        ).matcher(text);
        if (mrz.find()) {
            String givens = mrz.group(1).split("<<")[0];
            String first = givens.replace('<', ' ').trim().split("\\s+")[0];
            if (first.length() >= 2 && first.matches("[A-Z]+")) {
                return capitalizeName(first);
            }
        }

        // Strategy 2 — labelled field. On Spanish DNI 3.0 / DL / passport
        // the printed layout has the given name on a separate line below
        // the label:
        //     NOMBRE / NAME                        ← DNI 3.0
        //     MANOLO
        //     (2) Nombre/Given Names/Prenoms       ← passport style
        //     MANOLO
        // or, on the driving license, inline:
        //     2. MANOLO
        // We accept all label flavours and allow the gap between label and
        // value to span newlines (capped to ~80 chars so we don't wander
        // far into the document).
        Matcher m = Pattern.compile(
                "(?im)(?:\\(\\s*2\\s*\\)|^\\s*2\\s*[\\.)]|\\bNombre\\b|Given\\s+Names|\\bName\\b|\\bPrenoms?\\b)" +
                "[^A-Z\u00d1]{0,80}?([A-Z\u00d1\u00c1\u00c9\u00cd\u00d3\u00da][A-Z\u00d1\u00c1\u00c9\u00cd\u00d3\u00da\\s]{1,30})"
        ).matcher(text);
        if (m.find()) {
            String token = m.group(1).trim().split("\\s+")[0];
            if (token.length() >= 2 && !isLikelyNoise(token)) {
                return capitalizeName(token);
            }
        }
        return null;
    }

    private boolean isLikelyNoise(String token) {
        // Reject obvious country / common-noise tokens that sometimes get
        // captured by the broad "next ALL-CAPS line" heuristic.
        switch (token) {
            case "ESPANA": case "ESPAA": case "ESPANOLA": case "ESPANOL":
            case "REINO": case "PASAPORTE": case "PASSPORT": case "DNI":
                return true;
            default:
                return false;
        }
    }

    private String capitalizeName(String upper) {
        if (upper == null || upper.isEmpty()) return upper;
        String lower = upper.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private String findReceiptCategory(String text) {
        if (text == null || text.isBlank()) return null;
        String n = stripAccents(text.toLowerCase(Locale.ROOT));
        // Brand-based classification runs FIRST. Receipts from electronics
        // retailers commonly print return-policy boilerplate ("Devolucion
        // 60 dias sin abrir...") even when the purchase is a durable good
        // covered by the 3-year statutory warranty. Trusting that policy
        // text would mis-categorise the document; the merchant identity is
        // a stronger signal than free-form copy on the ticket.
        // Restrict brand matching to the header so a product line that
        // happens to contain a brand name doesn't change the category.
        String[] lines = text.split("\\r?\\n");
        int headerLines = Math.min(lines.length, 6);
        StringBuilder hb = new StringBuilder();
        for (int i = 0; i < headerLines; i++) hb.append(lines[i]).append('\n');
        String header = stripAccents(hb.toString().toLowerCase(Locale.ROOT));
        String[] warrantyRetailers = {
                "mediamarkt", "media markt", "fnac", "worten", "ikea",
                "leroy merlin", "el corte ingles"
        };
        for (String b : warrantyRetailers) {
            if (containsWord(header, b)) return "garantia";
        }
        for (String b : GROCERY_RETAILERS) {
            if (containsWord(header, b)) return "consumo";
        }
        for (String b : CLOTHING_BRANDS) {
            if (containsWord(header, stripAccents(b))) return "devolucion";
        }
        // Explicit keywords are a last resort: "garantia" is unambiguous,
        // but bare "devolucion" is risky (often appears as policy text).
        // Require an unambiguous refund-specific phrase.
        if (n.contains("garantia") || n.contains("warranty")) {
            return "garantia";
        }
        if (n.contains("reembolso") || n.contains("refund")
                || n.contains("return slip")
                || n.contains("ticket de devolucion")
                || n.contains("recibo de devolucion")) {
            return "devolucion";
        }
        return null;
    }
}
