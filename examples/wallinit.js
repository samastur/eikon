$(function () {
	/*
	 * Fetch set data from Flickr
	 */
	function FlickrSetPhotos(photo_set, row_height, per_page) {
		var per_page = per_page || 30,
			row_height = row_height || 150,
			next_page = 1,
			max_page = 0,
			photoset = photo_set || "",
			request_url = "http://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos"
							+"&api_key=2ed4112660c650e1735920146f62818b"
							+"&per_page="+per_page
							+"&photoset_id="+photoset+"&extras=url_s"
							+"&jsoncallback=?&format=json";

		return function (callback) {
			var page_url = request_url+"&page="+next_page;

			if (!max_page || next_page <= max_page) {
				$.getJSON(page_url, function (data) {
					if (data.stat !== 'ok') {
						callback([]);
					}

					var photos = data.photoset.photo,
						imgs = [],
						img_url_template = "http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}{size}.jpg",
						link_url_template = "http://www.flickr.com/photos/{user-id}/{id}/",
						user_id = data.photoset.owner,
						medium = 500,
						bmedium = 640,
						large = 1024;

					// Race condition: if new fetch is called before old one is finished, then this might not be set in time
					if (data.photoset.pages) {
						max_page = data.photoset.pages;
					}

					$.each(photos, function (i, photo) {
						var pic_size = "_m", w = 0, h = 0,
							img = {};
						photo.height_s = parseInt(photo.height_s, 10);
						photo.width_s = parseInt(photo.width_s, 10);

						if (photo.height_s < row_height) { // Size up until big enough
							if (Math.round(photo.height_s*(medium/photo.width_s)) >= row_height) {
								pic_size = "";
								w = medium;
								h = Math.round(photo.height_s*(medium/photo.width_s));
							} else if (Math.round(photo.height_s*(bmedium/photo.width_s)) >= row_height) {
								pic_size = "_z";
								w = bmedium;
								h = Math.round(photo.height_s*(bmedium/photo.width_s));
							} else {
								pic_size = "_b"; // Might not exist for older images and this might not be big enough for thinnest images
								w = large;
								h = Math.round(photo.height_s*(large/photo.width_s));
								return;
							}
						} else {
							w = photo.width_s;
							h = photo.height_s;
						}
						img['width'] = w;
						img['height'] = h;
						img['url'] = img_url_template.replace("{farm-id}", photo.farm)
												.replace("{server-id}", photo.server)
												.replace("{id}", photo.id)
												.replace("{secret}", photo.secret)
												.replace("{size}", pic_size);
						img['link_url'] = link_url_template.replace("{id}", photo.id)
												.replace("{user-id}", user_id)
						imgs.push(img);
					});

					callback(imgs);
				});
			}
			next_page += 1;
		};
	}

	/*
	 * Init
	 */
	var fetch_images = FlickrSetPhotos("72157609110110408", 150, 20);
	$("#photo-wall").photoWall({
		'getImages': fetch_images,
		'row_height': 120
	});
});
