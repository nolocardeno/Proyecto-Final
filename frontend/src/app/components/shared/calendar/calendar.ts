// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// TIPOS INTERNOS
// --------------------------------------------------------------------------
interface CalendarDay {
  date: Date;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

// --------------------------------------------------------------------------
// CONSTANTES
// --------------------------------------------------------------------------
const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const CALENDAR_CELLS = 42; // 6 filas x 7 columnas

// --------------------------------------------------------------------------
// COMPONENTE: CALENDAR (Calendario inline reutilizable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-calendar',
  imports: [FaIconComponent],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class CalendarComponent {
  selectedDate = input<Date | null>(null);

  dateChange = output<Date>();

  protected readonly faChevronLeft = faChevronLeft;
  protected readonly faChevronRight = faChevronRight;
  protected readonly weekdays = WEEKDAY_LABELS;

  private readonly viewDate = signal<Date>(this.startOfMonth(new Date()));

  constructor() {
    // Mantiene el calendario centrado en la fecha seleccionada cuando cambia
    // desde fuera (por ejemplo al pulsar un preset).
    effect(() => {
      const selected = this.selectedDate();
      if (!selected) return;
      const view = untracked(this.viewDate);
      if (
        selected.getFullYear() !== view.getFullYear() ||
        selected.getMonth() !== view.getMonth()
      ) {
        this.viewDate.set(this.startOfMonth(selected));
      }
    });
  }

  protected readonly monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  });

  protected readonly days = computed<CalendarDay[]>(() => {
    const view = this.viewDate();
    const selected = this.selectedDate();
    const today = this.startOfDay(new Date());
    const firstOfMonth = this.startOfMonth(view);
    const offset = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
    const gridStart = this.addDays(firstOfMonth, -offset);

    return Array.from({ length: CALENDAR_CELLS }, (_, i) => {
      const date = this.addDays(gridStart, i);
      return {
        date,
        day: date.getDate(),
        inCurrentMonth: date.getMonth() === view.getMonth(),
        isToday: this.isSameDay(date, today),
        isSelected: selected ? this.isSameDay(date, selected) : false,
      };
    });
  });

  protected previousMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected selectDay(day: CalendarDay): void {
    if (!day.inCurrentMonth) {
      this.viewDate.set(this.startOfMonth(day.date));
    }
    this.dateChange.emit(day.date);
  }

  // ------------------------------------------------------------------------
  // HELPERS DE FECHA
  // ------------------------------------------------------------------------
  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private addDays(date: Date, amount: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
