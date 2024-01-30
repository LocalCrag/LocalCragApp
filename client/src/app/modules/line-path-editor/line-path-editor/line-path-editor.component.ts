import {Component, forwardRef, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {TopoImagesService} from '../../../services/crud/topo-images.service';
import {ActivatedRoute, Route} from '@angular/router';
import {TopoImage} from '../../../models/topo-image';

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

    public topoImage: TopoImage;

    private topoImageId: string = null;

    constructor(private topoImagesService: TopoImagesService,
                private route: ActivatedRoute) {
    }

    ngOnInit() {
        this.topoImageId = this.route.snapshot.paramMap.get('topo-image-id');
        this.topoImagesService.getTopoImage(this.topoImageId).subscribe(topoImage => {
            this.topoImage = topoImage;
        });
    }

    registerOnChange(fn: any): void {
    }

    registerOnTouched(fn: any): void {
    }

    setDisabledState(isDisabled: boolean): void {
    }

    writeValue(obj: any): void {
    }

}
