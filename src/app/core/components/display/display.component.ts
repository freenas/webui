import {
  Component, ViewChild, OnInit, AfterViewInit, Input, Renderer2, ViewContainerRef, ComponentRef, ComponentFactory, ComponentFactoryResolver,
} from '@angular/core';
import { LayoutContainer, LayoutChild } from 'app/core/classes/layouts';
import { ViewConfig } from 'app/core/components/viewcontroller/viewcontroller.component';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';

@Component({
  selector: '[displayContainer]',
  template: '<!-- This is just a placeholder similar to RouterOutlet. DONT PUT ANYTHING HERE!! -->',
})
export class DisplayContainer {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
@Component({
  selector: 'display',
  template: '<ng-container #test><ng-container displayContainer  #wrapper></ng-container></ng-container>',
})
export class Display implements OnInit, AfterViewInit {
  displayList: any[] = []; // items in DOM
  children: any[] = [];
  @ViewChild('wrapper', { static: true }) wrapper;
  @ViewChild('test', { static: true, read: ViewContainerRef }) test: ViewContainerRef;

  constructor(private resolver: ComponentFactoryResolver, private viewContainerRef: ViewContainerRef, private renderer: Renderer2) {
    console.log('Display Component Constructor');
  }

  ngOnInit() {}

  ngAfterViewInit() {
    console.log('******** Display AfterViewInit ********');
    console.log(this.test);

    if (!this.wrapper.viewContainerRef) { throw 'WTF... this.wrapper.viewContainerRef is undefined!'; }

    console.log('******** Display is Ready!!!! ********');
  }

  create(component: any) {
    console.log('******** Create()!!!! ********');
    console.log(this.wrapper);
    const compRef = <any> this.resolver.resolveComponentFactory(component).create(this.viewContainerRef.injector);
    // let compRef = <any>this.resolver.resolveComponentFactory(component).create(this.test.injector);
    this.children.push(compRef);
    return compRef.instance;
  }

  addChild(instance) {
    const compRef = this.getChild(instance);
    console.log('******** addChild()!!!! ********');
    console.log(compRef.hostView);
    /* NEW WAY */
    // Insert into DOM
    this.viewContainerRef.insert(compRef.hostView);// addChild();
    // this.test.insert(compRef.hostView);// addChild();

    // Deal with component's selector element
    const container = this.viewContainerRef.element.nativeElement;
    // this.moveContents(compRef, container);

    // Setup ChangeDetection and add to DisplayList
    compRef.changeDetectorRef.detectChanges();
    this.displayList.push(instance);
  }

  private moveContents(compRef, container) {
    const selector = compRef.hostView.rootNodes['0'];
    const contents = compRef.hostView.rootNodes['0'].childNodes;
    let node: any;
    console.log('******** moveContents() ********');
    console.log(contents);
    for (let i = 0; i < contents.length; i++) {
      console.log(typeof contents[i]);
      if (contents[i].tagName == 'MD-CARD') {
        this.renderer.appendChild(container, contents[i]);
        this.renderer.removeChild(container, selector);
      }
    }
  }

  removeChild(instance) {
    const compRef = this.getChild(instance);
    // Remove from children
    const ci = this.children.indexOf(compRef);
    this.children.splice(ci, 1);
    // Remove from displayList
    const dli = this.displayList.indexOf(instance);
    this.displayList.splice(dli, 1);

    // Destroy component reference
    compRef.destroy();
  }

  getChild(instance) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].instance == instance) {
        return this.children[i];
      }
    }
  }
}
