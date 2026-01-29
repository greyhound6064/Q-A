/**
 * @file carousel.js
 * @description 캐러셀 공통 로직
 * @exports CarouselManager
 */

export class CarouselManager {
    constructor(images, currentIndex = 0) {
        this.images = images;
        this.currentIndex = currentIndex;
    }
    
    prev() {
        if (this.images.length === 0) return this.currentIndex;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        return this.currentIndex;
    }
    
    next() {
        if (this.images.length === 0) return this.currentIndex;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        return this.currentIndex;
    }
    
    goTo(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
        }
        return this.currentIndex;
    }
    
    getCurrentImage() {
        return this.images[this.currentIndex];
    }
    
    getImages() {
        return this.images;
    }
    
    getCurrentIndex() {
        return this.currentIndex;
    }
    
    getLength() {
        return this.images.length;
    }
}
