import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommentsService } from '../../../services/crud/comments.service';
import { Comment } from '../../../models/comment';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { Textarea } from 'primeng/textarea';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { getObjectType } from '../../../models/object';
import { CommentsContextService } from '../comments-context.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';

@Component({
  selector: 'lc-comment-editor',
  imports: [
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    Textarea,
    TranslocoDirective,
    Button,
  ],
  templateUrl: './comment-editor.component.html',
  styleUrls: ['./comment-editor.component.scss'],
})
export class CommentEditorComponent implements OnInit, AfterViewInit {
  @Input() parentId: string | null = null;
  @Input() cancelable: boolean = false;
  @Input() autoFocus: boolean = false;
  @Input() commentToEdit: Comment | null = null;

  @Output() created = new EventEmitter<Comment>();
  @Output() cancelled = new EventEmitter<void>();

  public form: FormGroup;
  public saving = false;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private commentsService = inject(CommentsService);
  private commentsContextService = inject(CommentsContextService);
  @ViewChild('commentTextarea') private textareaRef: ElementRef;

  ngOnInit(): void {
    if (!this.commentsContextService.object) {
      throw new Error('CommentEditorComponent: object input is required');
    }
    this.buildForm();
  }

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      this.textareaRef?.nativeElement.focus();
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      message: [
        this.commentToEdit ? this.commentToEdit.message : '',
        [Validators.required, Validators.maxLength(2000)],
      ],
    });
  }

  reset() {
    this.buildForm();
  }

  cancel() {
    this.reset();
    this.cancelled.emit();
  }

  send() {
    if (this.form.invalid) return;
    const message: string = this.form.get('message').value?.trim();
    if (!message) return;
    this.saving = true;
    if (!this.commentToEdit) {
      const comment = new Comment();
      comment.message = message;
      comment.objectType = getObjectType(this.commentsContextService.object);
      comment.object = this.commentsContextService.object as any;
      comment.parentId = this.parentId ?? null;
      this.commentsService.createComment(comment).subscribe((created) => {
        this.created.emit(created);
        this.reset();
        this.store.dispatch(toastNotification('COMMENT_CREATED_SUCCESS'));
        this.saving = false;
      });
    } else {
      this.commentsService
        .updateComment(this.commentToEdit.id, message)
        .subscribe((updated) => {
          this.commentToEdit.message = updated.message;
          this.reset();
          this.cancelled.emit();
          this.store.dispatch(toastNotification('COMMENT_UPDATED_SUCCESS'));
          this.saving = false;
        });
    }
  }
}
