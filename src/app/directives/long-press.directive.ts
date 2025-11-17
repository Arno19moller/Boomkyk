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

  longPressTimeout: any;
  isLongPressing: boolean = false;
  private scrollableParent: HTMLElement | undefined = undefined;
  private parentScrollListener!: () => void;

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
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // event.preventDefault();
    this.startLongPress();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    // event.preventDefault();
    this.startLongPress();
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
        this.longPress.emit();
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
      // parent = parent.parentElement;
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
