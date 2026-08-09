import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { firstValueFrom } from 'rxjs';
import {
  addInstance,
  listInstances,
  removeInstance,
  setActiveHost,
  type SavedInstance,
} from '../../../services/core/instance-registry';
import { isLocalCragHealthResponse } from '../../../services/core/localcrag-health';
import {
  isAllowedApiHostUrl,
  normalizeApiHostUrl,
  RUNTIME_API_HOST,
} from '../../../services/core/runtime-api-host';

@Component({
  selector: 'lc-instance-picker',
  templateUrl: './instance-picker.component.html',
  styleUrls: ['./instance-picker.component.scss'],
  providers: [ConfirmationService],
  imports: [
    FormsModule,
    TranslocoDirective,
    TranslocoPipe,
    Button,
    InputText,
    MessageModule,
    ConfirmDialogModule,
  ],
})
export class InstancePickerComponent implements OnInit {
  public urlInput = '';
  public instances: SavedInstance[] = [];
  public busy = false;
  public errorKey: string | null = null;
  public readonly isNative = Capacitor.isNativePlatform();
  public readonly activeHost = inject(RUNTIME_API_HOST);

  private http = inject(HttpClient);
  private confirmation = inject(ConfirmationService);

  async ngOnInit(): Promise<void> {
    this.instances = await listInstances();
  }

  async validateAndSave(): Promise<void> {
    this.errorKey = null;
    const url = normalizeApiHostUrl(this.urlInput);
    if (!isAllowedApiHostUrl(url)) {
      this.errorKey = 'invalidUrl';
      return;
    }
    this.busy = true;
    try {
      const health = await firstValueFrom(
        this.http.get<unknown>(`${url}/api/health`),
      );
      if (!isLocalCragHealthResponse(health)) {
        this.errorKey = 'notLocalCrag';
        return;
      }
      let instanceName: string | null = null;
      try {
        const settings = await firstValueFrom(
          this.http.get<{ instanceName?: string }>(
            `${url}/api/instance-settings`,
          ),
        );
        instanceName = settings?.instanceName ?? null;
      } catch {
        instanceName = null;
      }
      const wasEmpty = this.instances.length === 0;
      const apiVersion =
        health &&
        typeof health === 'object' &&
        typeof (health as { version?: unknown }).version === 'string'
          ? ((health as { version: string }).version as string)
          : null;
      await addInstance({
        url,
        instanceName,
        apiVersion,
      });
      this.instances = await listInstances();
      this.urlInput = '';
      if (wasEmpty) {
        await setActiveHost(url);
        this.enterInstanceHome();
      }
    } catch {
      this.errorKey = 'unreachable';
    } finally {
      this.busy = false;
    }
  }

  async deleteInstance(instance: SavedInstance): Promise<void> {
    this.instances = await removeInstance(instance.url);
  }

  switchTo(instance: SavedInstance): void {
    if (
      normalizeApiHostUrl(instance.url) === normalizeApiHostUrl(this.activeHost)
    ) {
      // Already on this host — leave the picker for instance home.
      window.location.assign('/');
      return;
    }
    this.confirmation.confirm({
      message: instance.instanceName
        ? `${instance.instanceName} (${instance.url})`
        : instance.url,
      header: 'Switch instance?',
      acceptLabel: 'Switch',
      rejectLabel: 'Cancel',
      accept: async () => {
        await setActiveHost(instance.url);
        this.enterInstanceHome();
      },
    });
  }

  /** Full navigation so bootstrap picks up the new host and leaves /instances. */
  private enterInstanceHome(): void {
    window.location.assign('/');
  }
}
