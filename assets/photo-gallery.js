"use strict";

function photoGallery(images, title) {
  if (!Array.isArray(images) || !images.length) return null;
  const gallery = document.createElement("div");
  gallery.className = "photo-gallery";
  gallery.setAttribute("role", "group");
  gallery.setAttribute("aria-label", title + "的照片");

  for (const photo of images.slice(0, 8)) {
    if (!photo || typeof photo.hash !== "string" || !/^[a-f0-9]{64}$/.test(photo.hash)) continue;
    if (![photo.width, photo.height].every((value) => Number.isInteger(value) && value > 0 && value <= 2400)) continue;

    const src = "/assets/photos/" + photo.hash + ".jpg";
    const label = title + " · 照片 " + (gallery.childElementCount + 1);
    const link = document.createElement("a");
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "大图 · " + label);

    const image = document.createElement("img");
    image.src = src;
    image.alt = label;
    image.loading = "lazy";
    image.decoding = "async";
    image.width = photo.width;
    image.height = photo.height;

    link.append(image);
    gallery.append(link);
  }
  return gallery.childElementCount ? gallery : null;
}

function appendGallery(parent, images, title) {
  const gallery = photoGallery(images, title);
  if (gallery) parent.append(gallery);
}
