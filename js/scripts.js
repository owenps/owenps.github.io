$(document).ready(function(){
   // Add smooth scrolling to all links
      $('a[href^="#"]').on('click', function (e) {
          e.preventDefault();
 
          var target = this.hash,
              $target = $(target);
 
          $('html, body').stop().animate({
              'scrollTop': $target.offset().top - 80
          }, 1200, 'swing', function () {
              
          });
      });

   // Activate scrollspy to add active class to navbar items on scroll
   $('body').scrollspy({
      target: '#mainNav',
      offset: 80
    });
 });
