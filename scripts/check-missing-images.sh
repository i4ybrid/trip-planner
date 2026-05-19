#!/bin/bash
# Check which images in image_catalog.json don't exist on disk

cd /mnt/user/development/trip-planner

echo "========================================"
echo "Splash Image Audit"
echo "========================================"
echo ""

# Count total entries
TOTAL=$(python3 -c "import json; print(len(json.load(open('image_catalog.json'))))")
EXISTING=$(ls frontend/public/images/splash/*.jpg frontend/public/images/splash/*.png 2>/dev/null | wc -l)

echo "Catalog entries: $TOTAL"
echo "Files on disk:   $EXISTING"
echo "Missing:         $(($TOTAL - $EXISTING))"
echo ""

# Find missing files
MISSING=$(python3 -c "
import json, os
catalog = json.load(open('image_catalog.json'))
existing = set(f for f in os.listdir('frontend/public/images/splash/') if f.endswith(('.jpg','.png')))
missing = [item for item in catalog if item['filename'] not in existing]
missing.sort(key=lambda x: x['filename'])
for item in missing:
    print(item['filename'])
")

if [ -n "$MISSING" ]; then
    echo "========================================"
    echo "MISSING FILES ($(echo "$MISSING" | wc -l)):"
    echo "========================================"
    echo "$MISSING"
else
    echo "All catalog images exist on disk!"
fi
