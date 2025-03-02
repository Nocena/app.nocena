#!/bin/bash

# Create directories
mkdir -p public/icons

# Check if logo exists (checking for LogoDark.png which is visible in your screenshot)
if [ ! -f public/logo/LogoDark.png ]; then
  echo "Logo not found at public/logo/LogoDark.png"
  exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
  echo "ImageMagick not found. Please install it first."
  echo "For Mac: brew install imagemagick"
  echo "For Ubuntu: sudo apt-get install imagemagick"
  exit 1
fi

# Generate standard PWA icons
convert public/logo/LogoDark.png -resize 512x512 public/icons/icon-512x512.png
convert public/logo/LogoDark.png -resize 384x384 public/icons/icon-384x384.png
convert public/logo/LogoDark.png -resize 192x192 public/icons/icon-192x192.png
convert public/logo/LogoDark.png -resize 192x192 public/icons/192.png  # iOS sometimes looks for this name

# Generate favicon icons
convert public/logo/LogoDark.png -resize 32x32 public/icons/favicon-32x32.png
convert public/logo/LogoDark.png -resize 16x16 public/icons/favicon-16x16.png
convert public/logo/LogoDark.png -resize 16x16 public/favicon.ico

# Generate Apple Touch icons (iOS)
convert public/logo/LogoDark.png -resize 180x180 public/icons/apple-touch-icon.png
cp public/icons/apple-touch-icon.png public/apple-touch-icon.png  # Root level for iOS
cp public/icons/apple-touch-icon.png public/apple-touch-icon-precomposed.png  # Some iOS versions look for this

# Generate specific iOS sizes
convert public/logo/LogoDark.png -resize 120x120 public/apple-touch-icon-120x120.png
convert public/logo/LogoDark.png -resize 120x120 public/apple-touch-icon-120x120-precomposed.png
convert public/logo/LogoDark.png -resize 152x152 public/apple-touch-icon-152x152.png
convert public/logo/LogoDark.png -resize 167x167 public/apple-touch-icon-167x167.png
convert public/logo/LogoDark.png -resize 180x180 public/apple-touch-icon-180x180.png

# Create shortcut icons
convert public/logo/LogoDark.png -resize 96x96 public/icons/shortcut-home.png
convert public/logo/LogoDark.png -resize 96x96 public/icons/shortcut-map.png

echo "All PWA icons generated successfully"