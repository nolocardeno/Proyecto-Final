// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, OnDestroy, OnInit, input, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// TIPOS
// --------------------------------------------------------------------------

/** Entrada del índice (TOC) de la página. */
export interface LegalTocItem {
  /** Ancla `#id` de la sección en la página. */
  id: string;
  /** Texto que se muestra en el índice. */
  title: string;
  /** Icono Font Awesome mostrado junto al enlace. */
  icon: IconDefinition;
}

// --------------------------------------------------------------------------
// COMPONENTE: LEGAL LAYOUT
// --------------------------------------------------------------------------

/**
 * Envoltura visual para las páginas legales (términos, privacidad y
 * cookies). Renderiza una cabecera con icono y fecha, un índice lateral
 * con anclas y el contenido proyectado vía `<ng-content/>`.
 */
@Component({
  selector: 'app-legal-layout',
  imports: [FaIconComponent],
  templateUrl: './legal-layout.html',
  styleUrl: './legal-layout.scss',
})
export class LegalLayoutComponent implements OnInit, OnDestroy {
  /** Título principal de la página. */
  title = input.required<string>();
  /** Fecha de última actualización en formato legible. */
  updatedAt = input.required<string>();
  /** Icono destacado en la cabecera. */
  heroIcon = input.required<IconDefinition>();
  /** Secciones de la página, mostradas como índice navegable. */
  sections = input.required<LegalTocItem[]>();

  protected readonly faClock = faClockRotateLeft;

  /** Id de la sección actualmente visible en el viewport. */
  protected readonly activeId = signal<string>('');

  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    // Slight delay so the DOM has rendered the projected <app-legal-section> elements.
    setTimeout(() => this.initObserver(), 0);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private initObserver(): void {
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4; // 4rem
    const margin = -(headerHeight + 16); // header + a bit of breathing room

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeId.set(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: `${margin}px 0px -60% 0px`, threshold: 0 },
    );

    for (const section of this.sections()) {
      const el = document.getElementById(section.id);
      if (el) this.observer.observe(el);
    }
  }

  /** Desplaza suavemente hasta la sección indicada sin dejar que el router navegue. */
  protected scrollTo(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
