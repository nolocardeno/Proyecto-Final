// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, effect, input, model } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// CONSTANTES
// --------------------------------------------------------------------------
const ELLIPSIS = '…';
type PageItem = number | typeof ELLIPSIS;

// --------------------------------------------------------------------------
// COMPONENTE: PAGINATION (Reutilizable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-pagination',
  imports: [FaIconComponent],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class PaginationComponent {
  totalItems = input.required<number>();
  pageSize = input<number>(9);
  siblingCount = input<number>(1);
  currentPage = model<number>(1);

  protected readonly faChevronLeft = faChevronLeft;
  protected readonly faChevronRight = faChevronRight;
  protected readonly ellipsis = ELLIPSIS;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );

  protected readonly pages = computed<PageItem[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const siblings = this.siblingCount();

    // Mostrar todas las páginas si caben sin elipsis
    const totalSlots = siblings * 2 + 5;
    if (total <= totalSlots) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const leftSibling = Math.max(current - siblings, 1);
    const rightSibling = Math.min(current + siblings, total);
    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < total - 1;

    const items: PageItem[] = [1];

    if (showLeftEllipsis) {
      items.push(ELLIPSIS);
    } else {
      for (let i = 2; i < leftSibling; i++) items.push(i);
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== total) items.push(i);
    }

    if (showRightEllipsis) {
      items.push(ELLIPSIS);
    } else {
      for (let i = rightSibling + 1; i < total; i++) items.push(i);
    }

    items.push(total);
    return items;
  });

  constructor() {
    // Mantener la página actual dentro de los límites cuando cambia el total
    effect(() => {
      const max = this.totalPages();
      if (this.currentPage() > max) {
        this.currentPage.set(max);
      }
    });
  }

  protected isPage(item: PageItem): item is number {
    return typeof item === 'number';
  }

  protected goTo(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    if (clamped === this.currentPage()) {
      return;
    }

    // Mantener la posición de scroll: si el alto de la página disminuye al
    // renderizar menos items, el navegador truncaría el scroll al máximo
    // disponible, dando la sensación de "saltar arriba". Restauramos en el
    // siguiente frame, después de que Angular haya actualizado el DOM.
    const previousScrollY = window.scrollY;
    this.currentPage.set(clamped);
    requestAnimationFrame(() => {
      window.scrollTo({ top: previousScrollY, left: window.scrollX });
    });
  }

  protected prev(): void {
    this.goTo(this.currentPage() - 1);
  }

  protected next(): void {
    this.goTo(this.currentPage() + 1);
  }
}
