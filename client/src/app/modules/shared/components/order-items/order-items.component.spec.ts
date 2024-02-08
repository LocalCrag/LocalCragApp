import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderItemsComponent } from './order-items.component';

describe('OrderItemsComponent', () => {
  let component: OrderItemsComponent;
  let fixture: ComponentFixture<OrderItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderItemsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
