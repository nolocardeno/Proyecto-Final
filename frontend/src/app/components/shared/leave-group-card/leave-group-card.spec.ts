import { TestBed } from '@angular/core/testing';
import { LeaveGroupCardComponent } from './leave-group-card';

describe('LeaveGroupCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LeaveGroupCardComponent] }).compileComponents();
  });

  function build() {
    const fx = TestBed.createComponent(LeaveGroupCardComponent);
    fx.detectChanges();
    return fx.componentInstance as any;
  }

  it('openConfirm + onConfirm + onCancel', () => {
    const c = build();
    c.openConfirm();
    expect(c.showConfirm).toBeTrue();
    let e = false;
    c.leaveConfirmed.subscribe(() => (e = true));
    c.onConfirm();
    expect(e).toBeTrue();
    expect(c.showConfirm).toBeFalse();
    c.openConfirm();
    c.onCancel();
    expect(c.showConfirm).toBeFalse();
  });
});
