import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { environment } from '../../../../environments/environment';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Post } from '../../../models/post';
import { PostsService } from '../../../services/crud/posts.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Editor, EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { NgIf } from '@angular/common';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

/**
 * Form component for creating, editing and deleting blog posts.
 */
@Component({
  selector: 'lc-post-form',
  imports: [
    ButtonModule,
    CardModule,
    ConfirmPopupModule,
    EditorModule,
    InputTextModule,
    NgIf,
    ReactiveFormsModule,
    TranslocoDirective,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.scss',
  providers: [ConfirmationService],
})
export class PostFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild(Editor) editor: Editor;

  public postForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public post: Post;
  public editMode = false;
  public quillModules: any;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private postsService: PostsService,
    private uploadService: UploadService,
    private title: Title,
    private translocoService: TranslocoService,
    private confirmationService: ConfirmationService,
  ) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    const postSlug = this.route.snapshot.paramMap.get('post-slug');
    if (postSlug) {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('editPostFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.editMode = true;
      this.postForm.disable();
      this.postsService
        .getPost(postSlug)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        )
        .subscribe((post) => {
          this.post = post;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
          if (this.editor) {
            this.editor.getQuill().enable();
          }
        });
    } else {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('postFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /**
   * Builds the post form.
   */
  private buildForm() {
    this.postForm = this.fb.group({
      title: [null, [Validators.required, Validators.maxLength(120)]],
      text: [null, [Validators.required]],
    });
  }

  /**
   * Sets the form value based on an input sector and enables the form afterwards.
   */
  private setFormValue() {
    this.postForm.enable();
    this.postForm.patchValue({
      title: this.post.title,
      text: this.post.text,
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    this.router.navigate(['/news']);
  }

  /**
   * Saves the post and navigates to the post list.
   */
  public savePost() {
    if (this.postForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const post = new Post();
      post.title = this.postForm.get('title').value;
      post.text = this.postForm.get('text').value;
      if (this.post) {
        post.slug = this.post.slug;
        this.postsService.updatePost(post).subscribe(() => {
          this.store.dispatch(toastNotification('POST_UPDATED'));
          this.router.navigate(['/news']);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.postsService.createPost(post).subscribe(() => {
          this.store.dispatch(toastNotification('POST_CREATED'));
          this.router.navigate(['/news']);
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the post should really get deleted.
   * @param event Click event.
   */
  confirmDeletePost(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(
          marker('posts.askReallyWantToDeletePost'),
        ),
        acceptLabel: this.translocoService.translate(marker('posts.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('posts.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deletePost();
        },
      });
    });
  }

  /**
   * Deletes the post and navigates to the post list.
   */
  public deletePost() {
    this.postsService.deletePost(this.post).subscribe(() => {
      this.store.dispatch(toastNotification('POST_DELETED'));
      this.router.navigate(['/news']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}
