// --------------------------------------------------------------------------
// TESTS: AlertService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('debe inicializarse con la lista de alertas vacía', () => {
    expect(service.alerts()).toEqual([]);
  });

  it('show() añade una nueva alerta con id incremental', () => {
    service.show('success', 'Hola');
    service.show('error', 'Oops');

    const alerts = service.alerts();
    expect(alerts.length).toBe(2);
    expect(alerts[0]).toEqual(jasmine.objectContaining({ type: 'success', message: 'Hola' }));
    expect(alerts[1]).toEqual(jasmine.objectContaining({ type: 'error', message: 'Oops' }));
    expect(alerts[1].id).toBeGreaterThan(alerts[0].id);
  });

  it('show() programa el cierre automático tras la duración indicada', () => {
    service.show('info', 'auto', 2000);
    expect(service.alerts().length).toBe(1);
    jasmine.clock().tick(2001);
    expect(service.alerts().length).toBe(0);
  });

  it('show() utiliza 4000ms cuando no se especifica duración', () => {
    service.show('warning', 'def');
    jasmine.clock().tick(3999);
    expect(service.alerts().length).toBe(1);
    jasmine.clock().tick(2);
    expect(service.alerts().length).toBe(0);
  });

  it('close() elimina la alerta indicada y mantiene las demás', () => {
    service.show('success', 'a');
    service.show('error', 'b');
    const [first, second] = service.alerts();
    service.close(first.id);
    expect(service.alerts().length).toBe(1);
    expect(service.alerts()[0].id).toBe(second.id);
  });

  it('close() es idempotente con un id inexistente', () => {
    service.show('info', 'x');
    expect(() => service.close(9999)).not.toThrow();
    expect(service.alerts().length).toBe(1);
  });
});
