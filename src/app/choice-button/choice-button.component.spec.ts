import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoiceButtonComponent } from './choice-button.component';

describe('ChoiceButtonComponent', () => {
  let component: ChoiceButtonComponent;
  let fixture: ComponentFixture<ChoiceButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChoiceButtonComponent]
    });
    fixture = TestBed.createComponent(ChoiceButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
