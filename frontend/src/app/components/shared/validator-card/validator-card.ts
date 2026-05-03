// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, output, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';
import { CalendarComponent } from '../calendar/calendar';

// --------------------------------------------------------------------------
// TIPOS Y CONSTANTES
// --------------------------------------------------------------------------
interface DatePreset {
  label: string;
  monthsFromToday: number;
}

const DATE_PRESETS: readonly DatePreset[] = [
  { label: 'Hoy', monthsFromToday: 0 },
  { label: '+6 meses', monthsFromToday: 6 },
  { label: '+1 año', monthsFromToday: 12 },
  { label: '+2 años', monthsFromToday: 24 },
];

const FORMATTED_DATE_LOCALE = 'es-ES';
const FORMATTED_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

// --------------------------------------------------------------------------
// COMPONENTE: VALIDATOR CARD
// Presets rápidos + calendario inline + botón de comprobación.
// --------------------------------------------------------------------------

/**
 * Tarjeta del validador. Permite seleccionar una fecha mediante presets
 * rápidos («Hoy», «+6 meses», etc.) o un calendario inline. La fecha
 * formateada se calcula con `computed()` y se emite a través del
 * output `check` al pulsar el botón.
 */
@Component({
  selector: 'app-validator-card',
  imports: [ButtonComponent, CalendarComponent, FaIconComponent],
  templateUrl: './validator-card.html',
  styleUrl: './validator-card.scss',
})
export class ValidatorCardComponent {
  protected readonly presets = DATE_PRESETS;
  protected readonly faCalendarCheck = faCalendarCheck;
  /** Fecha actualmente seleccionada en el calendario o presets. */
  protected readonly selectedDate = signal<Date | null>(null);

  /** Fecha formateada en español (vacía si no hay selección). */
  protected readonly formattedDate = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    return new Intl.DateTimeFormat(
      FORMATTED_DATE_LOCALE,
      FORMATTED_DATE_OPTIONS,
    ).format(date);
  });

  /** Emitido al pulsar «Comprobar» con la fecha seleccionada. */
  readonly check = output<Date>();

  /** Actualiza la fecha cuando el usuario navega por el calendario. */
  protected onDateChange(date: Date): void {
    this.selectedDate.set(date);
  }

  /** Aplica un preset rápido sumando los meses indicados. */
  protected applyPreset(preset: DatePreset): void {
    this.selectedDate.set(this.computePresetDate(preset));
  }

  /** Determina si un preset coincide exactamente con la fecha seleccionada. */
  protected isPresetActive(preset: DatePreset): boolean {
    const selected = this.selectedDate();
    if (!selected) return false;
    const target = this.computePresetDate(preset);
    return (
      target.getFullYear() === selected.getFullYear() &&
      target.getMonth() === selected.getMonth() &&
      target.getDate() === selected.getDate()
    );
  }

  /** Emite la fecha seleccionada por el output `check`. */
  protected onCheck(): void {
    const date = this.selectedDate();
    if (!date) return;
    this.check.emit(date);
  }

  /** Calcula la fecha equivalente a un preset (hoy + N meses). */
  private computePresetDate(preset: DatePreset): Date {
    const today = new Date();
    return new Date(
      today.getFullYear(),
      today.getMonth() + preset.monthsFromToday,
      today.getDate(),
    );
  }
}
