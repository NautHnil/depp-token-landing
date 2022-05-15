var wHeight = window.innerHeight;
$(document).ready(function () {
  $("a[href*=\\#]:not([href=\\#])").bind("click", function (e) {
    e.preventDefault(); // prevent hard jump, the default behavior

    var target = $(this).attr("href"); // Set the target as variable
    // perform animated scrolling by getting top-position of target-element and set it as scroll target

    $("html, body").stop().animate({
      scrollTop: $(target).offset().top
    }, 600, function () {
      location.hash = target; //attach the hash (#jumptarget) to the pageurl
    });

    if (window.innerWidth < 992) {
      $(".navbar-toggler").trigger("click");
    }

    return false;
  });
});
$(document).ready(function () {
  $("#go-top").on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({
      scrollTop: 0
    }, 500);
  });
});
$(document).ready(function () {
  $('[data-waypoints="init"]').each(function () {
    var $el = $(this);
    $el.waypoint(function (direction) {
      animateWP(this.element, direction);
    }, {
      offset: "90%"
    });
  });
});

animateWP = function animateWP(target, direction) {
  var effect = $(target).data("effect");

  if (direction === "down") {
    $(target).addClass("animated " + effect);
  }

  if (direction === "up") {
    $(target).removeClass("animated " + effect);
  }
};

$(window).scroll(function () {
  var scrollDistance = $(window).scrollTop();
  var perHeight = 35; // The percent value of window height

  var offsetTop = wHeight / 100 * perHeight; // Assign active class to nav links while scrolling

  $(".suv-section").each(function (i) {
    if (i === 0) {
      $(".navbar-nav .nav-item").removeClass("active");
      return;
    }

    if (i > 0 && $(this).position().top - offsetTop <= scrollDistance) {
      $(".navbar-nav .nav-item").removeClass("active");
      $(".navbar-nav .nav-link:not(.dropdown-toggle)").eq(i > 0 ? i - 1 : null).parent().addClass("active");
    }
  });

  if (scrollDistance >= 100) {
    $("#go-top").stop().addClass("show");
  } else {
    $("#go-top").stop().removeClass("show");
  }
}).scroll();
//# sourceMappingURL=maps/all.bundle.js.map
