import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective implements AfterViewInit, OnDestroy {
  @Input() longPressTime: number = 500;
  @Output() longPress: EventEmitter<HTMLElement> = new EventEmitter();
  @Output() doubleClick: EventEmitter<HTMLElement> = new EventEmitter();

  longPressTimeout: any;
  isLongPressing: boolean = false;
  private scrollableParent: HTMLElement | undefined = undefined;
  private parentScrollListener!: () => void;
  private initialX: number = 0;
  private initialY: number = 0;
  private moveThreshold: number = 10; // pixels

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.scrollableParent = this.getScrollableParent(this.el.nativeElement);

    if (this.scrollableParent) {
      this.setupParentScrollListener(this.scrollableParent);
    } else {
      console.warn('LongPressDirective: Could not find a scrollable parent for the element:', this.el.nativeElement);
    }
  }

  // HostListeners
  @HostListener('dblclick', ['$event'])
  onDoubleClick(event: MouseEvent) {
    this.doubleClick.emit(this.el.nativeElement);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // event.preventDefault();
    this.initialX = event.clientX;
    this.initialY = event.clientY;
    this.startLongPress();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    // event.preventDefault();
    if (event.touches.length > 0) {
      this.initialX = event.touches[0].clientX;
      this.initialY = event.touches[0].clientY;
    }
    this.startLongPress();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isLongPressing) {
      const deltaX = Math.abs(event.clientX - this.initialX);
      const deltaY = Math.abs(event.clientY - this.initialY);

      if (deltaX > this.moveThreshold || deltaY > this.moveThreshold) {
        this.endLongPress();
      }
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.isLongPressing && event.touches.length > 0) {
      const deltaX = Math.abs(event.touches[0].clientX - this.initialX);
      const deltaY = Math.abs(event.touches[0].clientY - this.initialY);

      if (deltaX > this.moveThreshold || deltaY > this.moveThreshold) {
        this.endLongPress();
      }
    }
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.endLongPress();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.endLongPress();
  }

  @HostListener('touchend')
  onTouchEnd() {
    this.endLongPress();
  }

  @HostListener('touchcancel')
  onTouchCancel() {
    this.endLongPress();
  }

  @HostListener('scroll')
  onScroll() {
    this.endLongPress();
  }

  startLongPress() {
    if (this.isLongPressing) return;

    this.isLongPressing = true;
    this.longPressTimeout = setTimeout(() => {
      if (this.isLongPressing) {
        this.longPress.emit(this.el.nativeElement);
      }
    }, this.longPressTime);
  }

  endLongPress() {
    this.isLongPressing = false;
    clearTimeout(this.longPressTimeout);
  }

  private getScrollableParent(element: HTMLElement): HTMLElement | undefined {
    let parent = element.parentElement;

    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.getPropertyValue('overflow-y');
      const overflowX = style.getPropertyValue('overflow-x');

      if (overflowY === 'scroll' || overflowY === 'auto' || overflowX === 'scroll' || overflowX === 'auto') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return undefined;
  }

  private setupParentScrollListener(parent: HTMLElement): void {
    this.parentScrollListener = () => {
      if (this.isLongPressing) {
        this.endLongPress();
      }
    };

    parent.addEventListener('scroll', this.parentScrollListener);
  }

  ngOnDestroy(): void {
    if (this.scrollableParent && this.parentScrollListener) {
      this.scrollableParent.removeEventListener('scroll', this.parentScrollListener);
    }
  }
}
