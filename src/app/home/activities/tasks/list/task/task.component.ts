import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CdkDragStart } from '@angular/cdk/drag-drop';
import { SocketService } from 'src/app/socket/socket.service';
import { ListsService } from '../../lists.service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {

  @Input() data: any;

  faTrash = faTrash;

  disabled: boolean;
  open: boolean = false;
  editVisible: boolean = false;

  socketService: SocketService;
  listsService: ListsService;

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if(!document.getElementById(this.data.task_id).contains(event.target) && this.open) {
      this.closeTask();
    }
  }

  constructor(socketService: SocketService, listsService: ListsService) {
    this.socketService = socketService;
    this.listsService = listsService;
  }

  ngOnInit(): void {
    this.socketService.reply.subscribe(msg => this.onResponseReceived(msg));
  }

  onResponseReceived(msg: any): void {
    if (msg["channel"] == "tasks") {
      if (msg["type"] == "request_task") {
        this.onRequestTask(msg);
      }
    }
  }

  startDragging(event: CdkDragStart<string[]>): void {
    event.source.data = this.data;
  }

  openTask(): void {
    if (!this.open) {
      let task: HTMLElement = document.getElementById(this.data.task_id);
      task.classList.add("open");

      let full: HTMLElement = document.getElementById(this.data.task_id + "-full");
      full.classList.add("full-shown");

      let removeTask: HTMLElement = document.getElementById(this.data.task_id + "-remove-task");
      removeTask.classList.remove("not-displayed");
  
      this.disabled = true;
      
      if (this.listsService.disabledLists.has(this.data.list_id)) {
        let num = this.listsService.disabledLists.get(this.data.list_id);
        this.listsService.disabledLists.set(this.data.list_id, num + 1);
      }
      else {
        this.listsService.disabledLists.set(this.data.list_id, 1);
      }

      this.socketService.sendMessage({channel: "tasks", type: "request_task", "task_id": this.data.task_id});
      this.open = true;
    }
  }

  saveTitle(): void {
    let titleField: HTMLElement = document.getElementById(this.data.task_id + "-title");
    titleField.blur();
    let title: string = titleField.innerHTML;
    this.socketService.sendMessage({channel: "tasks", type: "edit_task_title", task_id: this.data.task_id, title: title});
  }

  saveDescription(): void {
    let contents: HTMLElement = document.getElementById(this.data.task_id + "-contents");
    let description: string = contents.innerHTML;
    this.socketService.sendMessage({channel: "tasks", type: "edit_task_contents", task_id: this.data.task_id, contents: description});
  }

  closeTask(): void {
    let task: HTMLElement = document.getElementById(this.data.task_id);
    task.classList.remove("open");

    let full: HTMLElement = document.getElementById(this.data.task_id + "-full");
    full.classList.remove("full-shown");

    let removeTask: HTMLElement = document.getElementById(this.data.task_id + "-remove-task");
    removeTask.classList.add("not-displayed");

    this.disabled = false;

    let num = this.listsService.disabledLists.get(this.data.list_id);
    console.log(num);
    if (num == 1) {
      this.listsService.disabledLists.delete(this.data.list_id);
    }
    else {
      this.listsService.disabledLists.set(this.data.list_id, num - 1);
    }

    this.open = false;
    this.socketService.sendMessage({channel: "tasks", type: "request_task", "task_id": this.data.task_id});
  }

  removeTask() {
    this.socketService.sendMessage({channel: "tasks", type: "delete_task", "task_id": this.data.task_id});
  }

  onRequestTask(msg: any) {
    if (msg["task_id"] == this.data.task_id) {
      let contents: HTMLElement = document.getElementById(this.data.task_id + "-contents");
      contents.innerHTML = msg["contents"]; 
    }
  }
}