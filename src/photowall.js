var Zepto, jQuery;

/*
 * Photo Wall, (c) Marko Samastur (markos@gaivo.net)
 */
(function ($) {
$.fn.photoWall = function (params) {

	// Group images into rows, but don't forget to add last row
	function createRows(imgs, img_rows) {
		var img_row = img_rows.length ? img_rows[img_rows.length-1] : [],
			cur_w = 0,

			// Pointers for starting row and place (to easily add only new images
			// in other functions
			start_row = img_rows.length ? img_rows.length-1 : 0,
			start_element = img_row.length-1; // This is correct even when it returns -1

		// Cut last row so it's not counted twice
		img_rows.length = img_rows.length ? img_rows.length-1 : 0;

		// Calculate cur_w first
		if (img_row.length) {
			$.each(img_row, function (i, img) {
				cur_w += img['sized_width']+marginpadd;
			});
		}

		$.each(imgs, function (i, img) {
			var img_w = img['sized_width']+marginpadd; // padding+margin
			if (img_w > box_w) {
				// TODO: Special case: image wider than box
				if (row.length) {
					img_rows.push(img_row);
				}
				img_rows.push([img]);

				// New line
				img_row = [];
				cur_w = 0;
			} else if (img_w + cur_w < box_w) {
				img_row.push(img);
				cur_w += img_w;
			} else if (cur_w + img_w - box_w < box_w - cur_w) { // Optimize if by precalculating box_w-cur_w
				img_row.push(img);
				img_rows.push(img_row);

				// New line
				img_row = [];
				cur_w = 0;
			} else {
				img_rows.push(img_row);

				// New line
				img_row = [img];
				cur_w = img_w;
			}
		});

		if (img_row.length) {
			img_rows.push(img_row);
		}
		return { row: start_row, element: start_element };
	}

	function buildBrick(img_obj, height, hidden) {
		return $('<li'+hidden+'><a href="'+(img_obj.link_url || "#")+'"><img src="#" class="photowall-images" height="'+height+'" /></a></li>');
	}

	// Load images and add them to page
	function addImages(img_rows, start_row, start_element) {
		var imgrows = img_rows.slice(start_row);

		$.each(imgrows, function (i, row) {
			var padding = row.length * marginpadd, // padding around images
				row_w = 0,
				row_len = row.length,
				max_stretch = 1.15,
				new_height = 150;

			$.each(row, function (i, img) {
				row_w += img['sized_width'];
			});

			// Don't allow it to stretch too much
			new_height = Math.min(Math.floor(settings.row_height*(box_w-padding)/row_w)-1, Math.round(new_height*max_stretch));

			$.each(row, function (j, img) {
				var hidden = !wall_visible ? "" : ' class="hidden"',
					$li = null;

				if (i === 0 && j <= start_element) {
					// Already inserted. Just need to resize it
					$('img[src="'+img['url']+'"]').height(new_height);
					return;
				}
				unloaded += 1;

				$li = settings.buildBrick ? $(settings.buildBrick(img, new_height, hidden)) : buildBrick(img, new_height, hidden);
				$li.find("img.photowall-images")
					.bind("load", function (e) {
						unloaded -= 1;
						$(this).parents("li").removeClass("hidden");
					}).bind("error", function (e) {
						unloaded -= 1;
						$(this).parents("li").hide(); // Remove would screw up index
					})
					.attr("src", img['url']).end()
					.appendTo("ul", $box);
			});
		});
	}

	// Make final adjustments to row lenghts (stretch images)
	function realignRows() {
		/* realign can happen after multiple createRows so always start at top */
		var last_index = -1,
			img_index = 0,
			box_w = $box.width()-1,
			li = null,
			$img = null;

		//$("li.first, li.last", $box).removeClass("first").removeClass("last");
		$.each(img_rows, function (i, row) {
			var diff = 0,
				stretch = 0,
				remainder = 0;
				row_length = row.length;

			if (i == img_rows.length-1) {
				return false;
			}

			img_index = last_index+1;
			last_index += row_length;

			li = $("li", $box)[last_index];
			$img = $("img", li);

			// Mark first and last photo in row
			$($("li", $box).get(img_index)).addClass("first");
			$($("li", $box).get(last_index)).addClass("last");

			// position can be float and lose a pixel to certainly avoid wrap
			diff = box_w - parseInt($(li).outerWidth(true) + $(li).position().left)-1;
			stretch = Math.floor(diff/row_length);
			remainder = diff - stretch*(row_length-1);

			// Add equal share to each image in row and remainder to last one
			// Also avoid big stretches (>15%)
			$.each(row, function (j, im) {
				var li = $("li", $box)[img_index],
					$img = $("img", li),
					img_w = $img.width(),
					new_w = img_w+stretch;

				if (j === row_length-1) {
					new_w = img_w + remainder;
				}
				if (new_w !== img_w) {
					if (new_w/img_w < 1.15) {
						$img.width(new_w);
					} else {
						remainder += (new_w - img_w);
					}
				}
				img_index += 1;
			});
		});
	}

	// Show images after they have all loaded
	function showImages() {
		if (unloaded == 0) {
			realignRows();

			// Voila. Flaunt it!
			if (!wall_visible) {
				if ($box.animate) {
					$box.animate({opacity: 1}, "slow");
				} else {
					$box.css("opacity", 1);
				}
				wall_visible = true;
			}
			return true;
		}
		setTimeout(showImages, 150);
		return false;
	}

	function addNew(imgs) {
		loading_images = false;

		$.each(imgs, function (i, img) {
			img['sized_width'] = Math.floor(img['width']*settings.row_height/img['height']);
		});

		settings.images.concat(imgs);

		if (!imgs.length) {
			fetched_all = true;
			return;
		}

		start_position = createRows(imgs, img_rows);
		addImages(img_rows, start_position.row, start_position.element);
		setTimeout(showImages, 150);
	}

	// Get more images if we can when close to wall bottom
	function getMoreImages() {
		// Return 0 if fetched all images, 1 if enough to fill screen and >1 otherwise
		var uncovered_px = $box.height()+$box.offset().top - ($(document).scrollTop()+window.innerHeight),
			uncovered_rows = uncovered_px / settings.row_height;

		if (unloaded) {
			// Don't load more than if not all have loaded (think: slow connections!)
			return 3;
		}

		if (!fetched_all) {
			if (uncovered_rows < 2) {
				if (!loading_images && settings.getImages) {
					loading_images = true;
					settings.getImages(addNew);
				}
				return 2;
			}
			return 1;
		}
		return 0;
	}

	function init() {
		function fetch() {
			// Fetch images until we fill screen or have them all
			if (getMoreImages() > 1) {
				setTimeout(fetch, 1000);
			}
		}

		// Add outerWidth if it doesn't exist
		if (!$box.outerWidth) {
			//$.fn.getComputed = getComputed;
			$.fn.outerWidth = outerWidth;
		}

		$box.css("opacity", 0);

		// Build environment and make measurements
		$("<ul />").appendTo($box);
		$('<li><img src="#" width="1" height="1" /></li>').appendTo("ul", $box);
		marginpadd = $("ul li", $box).last().outerWidth(true)-1;
		$("ul li", $box).last().remove();

		// Hover and click image handlers
		$("li a", $box)
			.live("click", settings.clickImage || function (e) { e.stopPropagation;e.preventDefault(); });

		// TODO: Get data first from HTML, before fetching it
		fetch();
	}

	var settings = {
			row_height: 150,
			images: [],
		},
		$box = this.first(),
		box_w = $box.width(),
		img_rows = [],

		// Internal book-keeping
		start_position = {},
		wall_visible = false,
		loading_images = false,
		fetched_all = false,
		marginpadd = 0,
		unloaded = 0;

	if ( params ) {
		$.extend( settings, params );
	}

	init();

	$(window).bind("scroll", function (e) {
		if (getMoreImages() == 0) {
			$(window).unbind("scroll", arguments.callee);
		}
	});

	return $box;
};
})(jQuery || Zepto);
