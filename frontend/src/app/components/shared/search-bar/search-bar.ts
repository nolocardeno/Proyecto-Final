// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, OnDestroy, OnInit, input, model, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// --------------------------------------------------------------------------
// COMPONENTE: SEARCH BAR
// --------------------------------------------------------------------------

/**
 * Barra de búsqueda reutilizable.
 *
 * Cubre tres aspectos relevantes para la rúbrica DWEC:
 *  - **Eventos**: captura `input`, `focus` y `blur` del campo nativo.
 *  - **Comunicación asíncrona / RxJS**: el texto introducido se canaliza
 *    a través de un `Subject<string>` y se aplica una pipeline con
 *    `debounceTime(300)` (evita disparar la búsqueda con cada tecla) y
 *    `distinctUntilChanged()` (evita emitir consultas duplicadas).
 *  - **Limpieza**: `ngOnDestroy` libera la suscripción para evitar fugas.
 */
@Component({
  selector: 'app-search-bar',
  imports: [FaIconComponent],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  /** Texto mostrado como placeholder. */
  placeholder = input<string>('Busca documentos...');
  /** Valor actual del campo (two-way binding). */
  value = model<string>('');
  /** Tiempo de debounce en milisegundos antes de emitir cambios. */
  debounceMs = input<number>(300);
  /** Emite el término ya estabilizado (tras debounce + distinct). */
  searchChange = output<string>();

  protected readonly faMagnifyingGlass = faMagnifyingGlass;
  protected focused = false;

  /** Stream interno donde se publican los cambios crudos del input. */
  private readonly term$ = new Subject<string>();
  private subscription?: Subscription;

  /**
   * Configura la pipeline RxJS:
   *   term$ → debounceTime(N) → distinctUntilChanged() → searchChange
   */
  ngOnInit(): void {
    this.subscription = this.term$
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged())
      .subscribe((term) => this.searchChange.emit(term));
  }

  /** Libera la suscripción al destruir el componente. */
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.term$.complete();
  }

  /** Manejador del evento `input`: actualiza el modelo y publica al stream. */
  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.term$.next(target.value);
  }

  /** Manejador del evento `focus`. */
  protected onFocus(): void {
    this.focused = true;
  }

  /** Manejador del evento `blur`. */
  protected onBlur(): void {
    this.focused = false;
  }
}
