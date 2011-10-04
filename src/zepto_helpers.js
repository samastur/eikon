var Zepto, jQuery;
/*
 * Helpers borrowed from jQuery and Zepto fork (https://github.com/bundyo/zepto)
 */
(function ($) {
	if (!$.fn.outerWidth) {
		$.extend($.fn, {
			getComputed: function (property) {
				return document.defaultView.getComputedStyle(this[0], '').getPropertyValue(property);
			},

			outerWidth: function (withMargin) {
				var margin = withMargin ? parseInt(this.getComputed('margin-left'), 10) + parseInt(this.getComputed('margin-right'), 10) : 0;
				return this[0] ? this[0].offsetWidth + margin : 0;
			}

		});
	}

	if (!$.fn.position) {
		$.extend($.fn, {
			position: function() {
				if ( !this[0] ) {
					return null;
				}

				var elem = this[0],
					rroot = /^(?:body|html)$/i,

				// Get *real* offsetParent
				offsetParent = this.offsetParent(elem),

				// Get correct offsets
				offset       = this.offset(),
				parentOffset = rroot.test(offsetParent.nodeName) ? { top: 0, left: 0 } : $(offsetParent).offset();

				// Subtract element margins
				// note: when an element has margin: auto the offsetLeft and marginLeft
				// are the same in Safari causing offset.left to incorrectly be 0
				offset.top  -= parseFloat( $(elem).css("marginTop") ) || 0;
				offset.left -= parseFloat( $(elem).css("marginLeft") ) || 0;

				// Add offsetParent borders
				parentOffset.top  += parseFloat( $(offsetParent).css("borderTopWidth") ) || 0;
				parentOffset.left += parseFloat( $(offsetParent).css("borderLeftWidth") ) || 0;

				// Subtract the two offsets
				return {
					top:  offset.top  - parentOffset.top,
					left: offset.left - parentOffset.left
				};
			},

			offsetParent: function(el) {
				var rroot = /^(?:body|html)$/i,
				offsetParent = el.offsetParent || document.body;

				while ( offsetParent && (!rroot.test(offsetParent.nodeName) && $(offsetParent).css("position") === "static") ) {
					offsetParent = offsetParent.offsetParent;
				}
				return offsetParent;
			}
		});
	}

})(jQuery || Zepto);
