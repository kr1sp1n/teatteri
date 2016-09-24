(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.SlideShow = factory();
    }
}(this, function () {

    function createElement(tag, className, text) {
        var elm = document.createElement(tag);
        elm.className = className;
        if (text) elm.appendChild(document.createTextNode(text));
        return elm;
    }

    function addSlide(elmChild, captions) {
      elmImg = elmChild.querySelector('img');
      if (elmImg && elmImg.title) {
        var elmCaption = createElement('div', 'caption');
        elmCaption.appendChild(createElement('span', 'title', elmImg.title));
        elmCaption.appendChild(createElement('span', 'alt', elmImg.alt));
        elmChild.appendChild(elmCaption);
        captions.push(elmCaption);
      }
    }

    function SlideShow(selector, options) {
      options = {
        timeout: options && options.timeout || 5000
      };

      this.element = document.querySelector(selector);
      if (!this.element) {
        throw new Error('Element not found');
      }

      // Add slideshow classes
      this.element.classList.add('slideshow');
      this.element.classList.add('preload');

      // Create caption elements from image properties
      this._captions = [];
      for (var i = 0; i < this.element.children.length; i++) {
        addSlide(this.element.children[i], this._captions);
      }

      // Remove preload class to enable transition animations
      setTimeout(function () {
        this.element.classList.remove('preload');
      }.bind(this));

      // Start the slidehshow
      var index = 0;
      this._ticker = setInterval(function () {
        this.currentSlide.classList.remove('show-animation');
        index = (index + 1) % this.element.children.length;
        this.currentSlide = this.element.children[index];
        this.currentSlide.classList.add('show-animation');
      }.bind(this), options.timeout);
    }

    SlideShow.prototype = {
        constructor: SlideShow,
        add: function (data) {
          var img = document.createElement('img');
          var src = document.createAttribute("src");
          var title = document.createAttribute("title");
          var height = document.createAttribute("height");
          var _class = document.createAttribute("class");
          src.value = "data:" + data.mimetype + ";base64," + data.image;
          if (data.comment && data.comment != 'undefinded') {
            title.value = data.comment;
          } else {
            title.value = today;
          }
          height.value = "100%";
          _class.value = "cover orient" + data.orientation;
          img.setAttributeNode(src);
          img.setAttributeNode(height);
          img.setAttributeNode(_class);

          var a = document.createElement('a');
          var href = document.createAttribute("href");
          href.value = "#";
          a.setAttributeNode(href);
          a.appendChild(img);

          var li = document.createElement('li');
          li.appendChild(a);
          var ul = document.getElementById('list');
          ul.appendChild(li);
          addSlide(li, this._captions);
          // Show the first slide
          if(this.element.children.length === 1) {
            this.currentSlide = this.element.children[0];
            this.currentSlide.classList.add('show-animation');
            // Set the dimensions of the container based on image size
            var elmImg = this.element.querySelector('img');
            var doResize = function () {
              this.element.style.height = elmImg.clientHeight + 'px';
            }.bind(this);
            doResize();
            window.addEventListener('resize', doResize);
          }
        },
        destroy: function () {
          clearInterval(this._ticker);
          this.currentSlide.classList.remove('show-animation');
          for (var i = 0; i < this._captions.length; i++) {
              this._captions[i].parentNode.removeChild(this._captions[i]);
          }
          this._captions = [];
        }
    }

    return SlideShow;

}));
