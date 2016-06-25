///<reference path="../../../browser.d.ts"/>

import {
    Component,
    Input,
    ElementRef,
    OnChanges,
    ViewChild,
    ViewChildren,
    QueryList,
    AfterViewInit,
    HostListener
} from "@angular/core";
import {Photo} from "../../../../common/entities/Photo";
import {GridRowBuilder} from "./GridRowBuilder";
import {GalleryLightboxComponent} from "../lightbox/lightbox.gallery.component";
import {GridPhoto} from "./GridPhoto";
import {GalleryPhotoComponent} from "./photo/photo.grid.gallery.component";

@Component({
    selector: 'gallery-grid',
    templateUrl: 'app/gallery/grid/grid.gallery.component.html',
    styleUrls: ['app/gallery/grid/grid.gallery.component.css'],
    directives: [GalleryPhotoComponent]
})
export class GalleryGridComponent implements OnChanges,AfterViewInit {

    @ViewChild('gridContainer') gridContainer:ElementRef;
    @ViewChildren(GalleryPhotoComponent) gridPhotoQL:QueryList<GalleryPhotoComponent>;

    @Input() photos:Array<Photo>;
    @Input() lightbox:GalleryLightboxComponent;

    photosToRender:Array<GridPhoto> = [];

    private IMAGE_MARGIN = 2;
    private TARGET_COL_COUNT = 5;
    private MIN_ROW_COUNT = 2;
    private MAX_ROW_COUNT = 5;

    constructor() {
    }

    ngOnChanges() {
        this.onPhotosChanged();
    }

    onResize() {
        this.onPhotosChanged();
    }

    ngAfterViewInit() {
        this.lightbox.gridPhotoQL = this.gridPhotoQL;

        //TODO: implement scroll detection


        this.onPhotosChanged();
    }


    private onPhotosChanged() {
        this.photos.sort((a:Photo, b:Photo) => {
            if (a.metadata.creationDate > b.metadata.creationDate) {
                return 1;
            }
            if (a.metadata.creationDate < b.metadata.creationDate) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        this.photosToRender = [];
        this.renderedPhotoIndex = 0;
        setImmediate(() => {
            this.renderPhotos();
        });
    }

    private renderedPhotoIndex:number = 0;

    private renderPhotos() {
        if (this.getContainerWidth() == 0 || this.renderedPhotoIndex >= this.photos.length || !this.shouldRenderMore()) {
            return;
        }

        let maxRowHeight = window.innerHeight / this.MIN_ROW_COUNT;
        let minRowHeight = window.innerHeight / this.MAX_ROW_COUNT;

        let renderedContentHeight = 0;

        while (this.renderedPhotoIndex < this.photos.length && this.shouldRenderMore(renderedContentHeight)) {

            let photoRowBuilder = new GridRowBuilder(this.photos, this.renderedPhotoIndex, this.IMAGE_MARGIN, this.getContainerWidth());
            photoRowBuilder.addPhotos(this.TARGET_COL_COUNT);
            photoRowBuilder.adjustRowHeightBetween(minRowHeight, maxRowHeight);

            let rowHeight = photoRowBuilder.calcRowHeight();
            let imageHeight = rowHeight - (this.IMAGE_MARGIN * 2);

            photoRowBuilder.getPhotoRow().forEach((photo) => {
                let imageWidth = imageHeight * (photo.metadata.size.width / photo.metadata.size.height);
                this.photosToRender.push(new GridPhoto(photo, imageWidth, imageHeight));
            });

            renderedContentHeight += rowHeight;
            this.renderedPhotoIndex += photoRowBuilder.getPhotoRow().length;
        
        }
    }


    private shouldRenderMore(offset:number = 0):boolean {
        return document.body.scrollTop >= (document.body.clientHeight + offset - window.innerHeight) * 0.7
            || document.body.clientHeight + offset < window.innerHeight;

    }

    @HostListener('window:scroll')
    onScroll() {
        this.renderPhotos();
    }

    private getContainerWidth():number {
        if (!this.gridContainer) {
            return 0;
        }
        return this.gridContainer.nativeElement.clientWidth;
    }


}



