import {ChangeDetectorRef, Component, forwardRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {TopoImagesService} from '../../../services/crud/topo-images.service';
import {ActivatedRoute, Route} from '@angular/router';
import {TopoImage} from '../../../models/topo-image';
import Konva from 'konva';
import {ThumbnailSize} from '../../../enums/thumbnail-size';
import {LinePath} from '../../../models/line-path';
import {TopoImageComponent} from '../../topo-images/topo-image/topo-image.component';

@Component({
    selector: 'lc-line-path-editor',
    templateUrl: './line-path-editor.component.html',
    styleUrls: ['./line-path-editor.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LinePathEditorComponent),
            multi: true,
        }
    ],
})
export class LinePathEditorComponent implements ControlValueAccessor, OnInit {

  // todo when immediately drawing a second line path, the first is not shown as low opacity path

    @ViewChild(TopoImageComponent) topoImageComponent: TopoImageComponent;

    public topoImage: TopoImage;
    public thumbnailSizes = ThumbnailSize;
    public linePath: LinePath;
    public isDisabled = false;

    private topoImageId: string = null;
    private onChange: (value: number[]) => void;
    private onTouched: () => void;

    constructor(private topoImagesService: TopoImagesService,
                private cdr: ChangeDetectorRef,
                private route: ActivatedRoute) {
    }

    ngOnInit() {
        this.topoImageId = this.route.snapshot.paramMap.get('topo-image-id');
        this.topoImagesService.getTopoImage(this.topoImageId).subscribe(topoImage => {
            this.topoImage = topoImage;
            this.cdr.detectChanges();
            this.topoImageComponent.el.nativeElement.addEventListener('click', this.addPoint.bind(this))
        });
        this.linePath = new LinePath();
    }

    addPoint(event: PointerEvent) {
        if (!this.isDisabled) {
            this.linePath.path.push((event.offsetX / this.topoImageComponent.width) * 100);
            this.linePath.path.push((event.offsetY / this.topoImageComponent.height) * 100);
            this.topoImageComponent.redraw();
            this.onChange(this.linePath.path);
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    writeValue(value: number[]): void {
        this.linePath.path = value;
    }


    // todo call when component loses focus, maybe force focus on click before if this is possible?
    onBlur(): void {
        this.onTouched();
    }

    @HostListener('focusout', ['$event'])
    focusout(event: any) {
        console.log('focusout', event);
    }

}
