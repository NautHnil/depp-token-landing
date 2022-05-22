console.clear();

// Scroll Parallax jQuery Plugin
// Author: Slava Nossar (hi@slava.codes)
// A jQuery plugin that lets you apply parallax to elements.
// Examples:
// https://audiencerepublic.com
// http://adventureandco.com.au
// https://kitchensofubereats.com
//
///////////////////
//// - Usage - ////
///////////////////
//
// Plugin can be started with `$('[data-parallax]').scrollParallax();`. This will start the parallax on all elements that have a `data-parallax` attribute set, e.g. <div data-parallax></div>
//
// You can use the `data-parallax` attribute to define the depth, e.g. <div data-parallax="30"></div>, which will override the default depth setting
//
// You can also just start the parallax on any group of elements, and default values will be used for them, e.g. $('img').scrollParallax();
//
// If equired, you can pass your own options into the plugin:
// $('[data-parallax]').scrollParallax({
// 	random: true,
//	randomRange: {
// 		min: 10,
// 		max: 60
//	},
// 	threshold: 2
// });
//
// By default, an element's parent element is used as a reference offset to compare to scroll position, but you can override this behaviour by using the `data-ref` attribute on any parent of the parallax element, e.g.
// <div data-ref>
// 	<div>
// 		<div data-parallax></div>
// 	<div>
// </div>
//
//
/////////////////////
//// - Options - ////
/////////////////////
//
// @param {obj} [options] Plugin options
//
// @param {int} [options.defaultDepth]
// An integer between 1 and 100. Controls how much the elmenent moves away from its starting point, simulating depth to the page, with 0 being the closest (more movement) and 100 being the furthest away (less movement). This will be used as a default for elements that don't have a `data-parallax` attribute with a value set.
// default: 80
//
// @param {int} [options.neutralPoint]
// An integer between 0 and 100. The vertical point along the browser window where the element will be at its original position. Can be any value, but it is recommended to choose a value between 0 and 100 (with 0 being the top of the window, and 100 being at bottom)
// default: 50
//
// @param {bool} [options.random]
// Specified whether a random depth should be set. Will override `options.defaultDepth`
// default: false
//
// @param {obj} [options.randomDepth]
// An array with two values that specified the minimum and maximum depth values to use when `options.random` is true.
// default: {min: 50, max: 80}
//
// @param {obj} [options.randomTween]
// An array with two values that specified the minimum and maximum tweenAmount values to use when `options.random` is true.
// default: {min: 8, max: 12}
//
// @param {str} [options.referenceAttr]
// Target attribute for reference elements
// default: data-ref
//
// @param {str} [options.parallaxAttr]
// Target attribute for parallax elements
// default: data-ref
//
// @param {int/float} [options.threshold]
// Once the change in distance for a single frame of animation falls below this amount, the parallax will stop and wait for scrolling to happen before starting again. Units are pixels
// default: 0.1
//
// @param {bool} [options.tween]
// Sets whether or not animation should be tweened
// default: true
//
// @param {int} [options.tweenAmount]
// An integer between 1 and 100. Controls how much tweening occurs, with 1 being very slow, and 100 being instantaneous.
// default: 10
//
//
(function ($, window) {
  $.scrollParallax = function (el, options) {
    var _this = this;
    _this.$el = $(el);

    // Get option values ready
    options.tweenAmount = confineRange(options.tweenAmount, 1, 100);
    options.randomDepth.min = confineRange(
      options.randomDepth.min,
      1,
      options.randomDepth.max
    );
    options.randomDepth.max = confineRange(
      options.randomDepth.max,
      options.randomDepth.min,
      100
    );
    options.randomTween.min = confineRange(
      options.randomTween.min,
      1,
      options.randomTween.max
    );
    options.randomTween.max = confineRange(
      options.randomTween.max,
      options.randomTween.min,
      100
    );

    options.defaultDepth = confineRange(options.defaultDepth, 1, 100);

    if (options.random) {
      options.defaultDepth = Math.floor(
        Math.random() * (options.randomDepth.max - options.randomDepth.min) +
          options.randomDepth.min
      );
      options.tweenAmount = Math.floor(
        Math.random() * (options.randomTween.max - options.randomTween.min) +
          options.randomTween.min
      );
    }

    _this.loop =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
    _this.looping = false;

    // Preloader for <img> elements
    if (_this.$el.is("img")) {
      var $tempImg = $("<img/>");

      $tempImg
        .on("load", () => {
          init();

          $tempImg = null;
        })
        .attr("src", $(el).attr("src"));
    } else {
      init();
    }

    function init() {
      // Set initial offset
      _this.currentOffset = 0;

      // Get initial transform matrix
      _this.matrix = parseMatrix(_this.$el.css("transform"));

      // Set parallax depth
      _this.depth =
        typeof _this.$el.attr(options.parallaxAttr) !== typeof undefined &&
        _this.$el.attr(options.parallaxAttr) !== false
          ? parseInt(_this.$el.attr(options.parallaxAttr), 10)
          : options.defaultDepth;
      _this.depth = (100 - _this.depth) / 100;

      // Set reference element
      _this.$ref = _this.$el.closest("[" + options.referenceAttr + "]").length
        ? _this.$el.closest("[" + options.referenceAttr + "]")
        : _this.$el.parent();

      // Set tweenAmount
      _this.tweenAmount = options.tweenAmount / 100;

      // Remove attributes
      _this.$el.removeAttr(options.parallaxAttr);
      _this.$ref.removeAttr(options.referenceAttr);

      // Watch for scroll
      scrollWatch();
    }

    function startParallax() {
      _this.looping = true;
      draw();
    }

    function draw() {
      updatePositions();

      if (_this.looping) {
        _this.loop.call(window, function () {
          return draw();
        });
      } else {
        scrollWatch();
      }
    }

    function updatePositions() {
      var scrollTop = $(window).scrollTop();
      var matrix = _this.matrix.slice(0);
      var newOffset =
        (_this.$ref.offset().top -
          scrollTop -
          $(window).height() / options.neutralPoint) *
        (1 - _this.depth);

      if (options.tween) {
        var delta = newOffset - _this.currentOffset;
        newOffset = _this.currentOffset + delta * _this.tweenAmount;

        if (Math.abs(delta) < options.threshold) {
          _this.looping = false;
        }
      }

      matrix[5] += newOffset;

      _this.$el.css("transform", buildMatrix(matrix));
      _this.currentOffset = newOffset;
    }

    function setEvents() {
      $(window).on("resize.parallax", function () {
        if (!_this.looping) {
          startParallax();
        }
      });
    }

    function scrollWatch() {
      $(window).one("scroll.parallax", function () {
        if (!_this.looping) {
          startParallax();
        }
      });
    }

    function buildMatrix(matrix) {
      return "matrix(" + matrix.join(",") + ")";
    }

    function parseMatrix(str) {
      var matrix = [1, 0, 0, 1, 0, 0];
      var matrixPattern =
        /^\w*\(([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?), ([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?), ([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?), ([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?), ([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?), ([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\)/i;

      if (matrixPattern.test(str)) {
        matrix = str.match(matrixPattern);
        matrix.shift();

        for (var i = 0; i < matrix.length; i++) {
          matrix[i] = Number(matrix[i]);
        }
      }

      return matrix;
    }

    function confineRange(value, min, max) {
      return value > max ? max : value < min ? min : value;
    }
  };

  $.fn.scrollParallax = function (options) {
    var options = $.extend(
      {
        defaultDepth: 20,
        neutralPoint: 50,
        random: false,
        randomDepth: {
          min: 50,
          max: 80,
        },
        randomTween: {
          min: 8,
          max: 12,
        },
        referenceAttr: "data-ref",
        parallaxAttr: "data-parallax",
        threshold: 0.1,
        tween: true,
        tweenAmount: 10,
      },
      options
    );

    return this.each(function () {
      var scrollParallax = new $.scrollParallax(this, options);
    });
  };
})(jQuery, window);
