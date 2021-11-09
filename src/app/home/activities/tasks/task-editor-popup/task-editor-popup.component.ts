import { Component, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/socket/socket.service';
import { TagDirective } from '../list/filter-popup/tag.directive';
import { TagComponent } from '../list/filter-popup/tag/tag.component';
import { TagsPopupDirective } from './tags-popup.directive';
import { TagsPopupComponent } from './tags-popup/tags-popup.component';

@Component({
  selector: 'app-task-editor-popup',
  templateUrl: './task-editor-popup.component.html',
  styleUrls: ['./task-editor-popup.component.css']
})
export class TaskEditorPopupComponent implements OnInit {
  

  data: any;
  onClose: Function;

  @ViewChild(TagsPopupDirective, { static: true }) public tagsPopupHost: TagsPopupDirective;
  @ViewChild(TagDirective, { static: true }) public tagHost: TagDirective;

  enteredTitle: string;
  enteredDescription: string;

  isEditingTitle: boolean = true;

  tagsPopupOpen: boolean = false;

  socketService: SocketService;
  componentFactoryResolver: ComponentFactoryResolver;

  socketSubscription: Subscription;
  

  constructor(socketService: SocketService, componentFactoryResolver: ComponentFactoryResolver) {
    this.socketService = socketService;
    this.componentFactoryResolver = componentFactoryResolver;
  }

  ngOnInit(): void {
    this.enteredTitle = this.data.title || "Untitled task";
    this.enteredDescription = this.data.contents;
    let modalContent: HTMLElement = document.getElementsByClassName("modal-content")[0] as HTMLElement;
    for (let tag of this.data.tags) {
      this.loadTag(tag);
    }
    modalContent.focus();
    this.socketSubscription = this.socketService.channelReply.get("tasks").subscribe(msg => this.onResponseReceived(msg));
  }

  ngOnDestroy(): void {
    this.socketSubscription.unsubscribe();
  }

  onResponseReceived(msg: any): void {
    if (msg["channel"] == "tasks") {
      if (msg["type"] == "add_tagging") {
        this.loadTag(msg);
      }
    }
  }

  onRequestTags(msg: any): void {
    for (let tag of msg["tags"]) this.loadTag(tag);
  }

  loadTag(data: any): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(TagComponent);

    const viewContainerRef = this.tagHost.viewContainerRef;

    let componentRef: ComponentRef<TagComponent>;

    componentRef = viewContainerRef.createComponent(componentFactory, data.index);

    let instance: TagComponent = <TagComponent>componentRef.instance;
    instance.data = data;
    instance.onSelect = this.removeTag.bind(this);
  }

  removeTag() {

  }

  toggleTags() {
    // request tags? or should have already requested them (probably)
    // make them display: flex or display: none depending on whether
    // they are already visible
    if (!this.tagsPopupOpen) this.openTagsPopup();
    else this.closeTagsPopup();
  }

  openTagsPopup() {
    const viewContainerRef = this.tagsPopupHost.viewContainerRef;
    viewContainerRef.clear();

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(TagsPopupComponent);

    let componentRef: ComponentRef<TagsPopupComponent>;

    componentRef = viewContainerRef.createComponent(componentFactory);

    let instance: TagsPopupComponent = <TagsPopupComponent>componentRef.instance;
    instance.data = this.data;
    this.tagsPopupOpen = true;
  }

  closeTagsPopup() {
    const viewContainerRef = this.tagsPopupHost.viewContainerRef;
    viewContainerRef.clear();
    this.tagsPopupOpen = false;
  }

  editTitle(): void {
    let titleField: HTMLInputElement = document.getElementById("task-title-field") as HTMLInputElement;
    this.enteredTitle = this.data.title;
    this.isEditingTitle = true;
  }

  saveTitle(): void {
    let titleField: HTMLInputElement = document.getElementById("task-title-field") as HTMLInputElement;
    if (this.enteredTitle != undefined) {
      if (titleField == document.activeElement) titleField.blur();
  
      this.data.title = this.enteredTitle;
  
      this.isEditingTitle = false;
      this.socketService.sendMessage({ channel: "tasks", type: "edit_task_title", task_id: this.data.task_id, title: this.enteredTitle });
    }
  }

  saveDescription(): void {
    if (this.enteredDescription != undefined) {  
      this.data.contents = this.enteredDescription;
  
      this.socketService.sendMessage({channel: "tasks", type: "edit_task_contents", task_id: this.data.task_id, contents: this.enteredDescription});
    }
  }

  changeActive(): void {
    this.socketService.sendMessage({channel: "tasks", type: "set_listing_active", listing_id: this.data.listing_id, active: !this.data.active});
  }

  changePublic(): void {
    this.socketService.sendMessage({channel: "tasks", type: "set_task_public", task_id: this.data.task_id, public: !this.data.public});
  }

  removeTask(event: Event): void {
    this.onClose(event);
    this.socketService.sendMessage({channel: "tasks", type: "delete_task", task_id: this.data.task_id, title: this.enteredTitle});
  }

}