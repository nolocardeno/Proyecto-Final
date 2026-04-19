// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, AfterViewInit, ElementRef } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faFileImport,
  faBell,
  faFolderOpen,
  faCalendarPlus,
  faUserGroup,
  faLaptop,
} from '@fortawesome/free-solid-svg-icons';
import { FeatureCardComponent } from '../../components/shared/feature-card/feature-card';
import { AccordionItemComponent } from '../../components/shared/accordion-item/accordion-item';
import { ButtonComponent } from '../../components/shared/button/button';
import { AuthModalService } from '../../services/auth-modal.service';

// --------------------------------------------------------------------------
// INTERFACES
// --------------------------------------------------------------------------
interface Feature {
  icon: IconDefinition;
  text: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

// --------------------------------------------------------------------------
// PÁGINA: LANDING PAGE
// --------------------------------------------------------------------------
@Component({
  selector: 'app-landing-page',
  imports: [FeatureCardComponent, AccordionItemComponent, ButtonComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPageComponent implements AfterViewInit {
  protected readonly authModal = inject(AuthModalService);
  private readonly el = inject(ElementRef);

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements: NodeListOf<Element> = this.el.nativeElement.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));
  }

  readonly features: Feature[] = [
    {
      icon: faFileImport,
      text: 'Escaneo y extracción automática',
      description: 'Sube una imagen de un documento y la aplicación extraerá automáticamente la información relevante para registrarlo de forma rápida.',
    },
    {
      icon: faBell,
      text: 'Alertas inteligentes de vencimiento',
      description: 'Recibe avisos antes de que un documento, ticket o devolución esté próximo a caducar para no perder fechas importantes.',
    },
    {
      icon: faFolderOpen,
      text: 'Organización de documentos',
      description: 'Guarda y organiza tus documentos personales y tickets en un único lugar para tener siempre toda tu información localizada.',
    },
    {
      icon: faCalendarPlus,
      text: 'Exportación a calendarios de terceros',
      description: 'Exporta vencimientos y recordatorios a calendarios externos para tener tus fechas importantes siempre visibles.',
    },
    {
      icon: faUserGroup,
      text: 'Gestión compartida entre usuarios',
      description: 'Comparte documentos y tickets con otras personas y gestiona información común desde una misma colección.',
    },
    {
      icon: faLaptop,
      text: 'Acceso desde cualquier lugar',
      description: 'Consulta tus documentos desde cualquier dispositivo a través de la aplicación web, cuando lo necesites.',
    },
  ];

  readonly faq: FaqItem[] = [
    {
      question: '¿Qué tipo de documentos puede reconocer Scantral?',
      answer:
        'Scantral puede reconocer cualquier tipo de documento que tenga una fecha de vencimiento o devolución asociada — desde pasaportes, DNI, carnet de conducir hasta tickets de devoluciones o garantías.',
    },
    {
      question: '¿Recibiré recordatorios antes de que un documento expire?',
      answer:
        'Sí. La aplicación te avisará automáticamente antes de que un documento, ticket o devolución esté próximo a caducar, para que puedas actuar con tiempo suficiente. Y puedes elegir por donde recibir estos recordatorios.',
    },
    {
      question: '¿Tengo que introducir toda la información manualmente?',
      answer:
        'No necesariamente. Puedes subir una imagen del ticket o documento y la aplicación intentará extraer automáticamente la información relevante. Ponte cómodo, Scantral lo hace por ti.',
    },
    {
      question: '¿Es seguro guardar mis documentos en la aplicación?',
      answer:
        'Absolutamente, en Scantral nos aseguramos que tus documentos sigan siendo confidenciales. Cada usuario tiene acceso únicamente a sus propios documentos y la información se gestiona de forma segura dentro del sistema.',
    },
    {
      question: '¿Puedo compartir documentos con otras personas?',
      answer:
        'Claro! Puedes organizar documentos y tickets en listas o grupos compartidos con otros usuarios para gestionarlos de forma conjunta. Facilidad en la gestión de documentos para cualquier tipo de grupo.',
    },
  ];
}
