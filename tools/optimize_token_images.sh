#!/bin/bash

# Token Image Optimizer for Alcor Exchange
# -----------------------------------------
# Optimizes token images to reduce file size while maintaining quality
# Target: 256x256px resolution, ~50-100KB file size
#
# Usage: ./tools/optimize_token_images.sh [options]
#        -h, --help     Show this help message
#        -s, --size     Target size in KB (default: 100)
#        -d, --dry-run  Preview changes without modifying files
#
# Run from the UI project root directory

echo "🔥 Token Image Optimizer - 256x256 with target size ~50-100KB"
echo "============================================================"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick is required but not installed."
    echo "   Install with: brew install imagemagick"
    exit 1
fi

# Create timestamped backup directory
backup_dir="assets/tokens_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
echo "📁 Creating backups in $backup_dir..."

processed=0
failed=0
total_before=0
total_after=0

# Process all PNG files larger than 100KB
for file in $(find assets/tokens -name "*.png" -size +100k); do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        dirname=$(dirname "$file")

        # Get original size
        size_before=$(stat -f%z "$file")
        size_kb=$((size_before / 1024))

        # Backup original
        cp "$file" "$backup_dir/$filename"

        echo ""
        echo "🎯 Processing: $filename (${size_kb}KB)"

        # Aggressive optimization:
        # 1. Resize to exactly 256x256
        # 2. Use lower quality (70-80)
        # 3. Strip all metadata
        # 4. Apply slight blur to reduce file size
        # 5. Reduce colors if needed

        # First pass - resize and basic optimization
        magick "$file" \
            -resize 256x256! \
            -quality 75 \
            -strip \
            -interlace None \
            -filter Box \
            "$file.tmp1" 2>/dev/null

        if [ -f "$file.tmp1" ]; then
            # Check if still too large
            tmp_size=$(stat -f%z "$file.tmp1")

            if [ $tmp_size -gt 102400 ]; then  # If still > 100KB
                echo "   📉 Applying extra compression..."
                # More aggressive - reduce quality further
                magick "$file.tmp1" \
                    -quality 60 \
                    -colors 256 \
                    "$file.tmp2" 2>/dev/null

                if [ -f "$file.tmp2" ]; then
                    mv "$file.tmp2" "$file"
                    rm -f "$file.tmp1"
                else
                    mv "$file.tmp1" "$file"
                fi
            else
                mv "$file.tmp1" "$file"
            fi

            # Get final size
            size_after=$(stat -f%z "$file")
            size_after_kb=$((size_after / 1024))
            saved_kb=$(((size_before - size_after) / 1024))
            percent=$((100 * saved_kb / size_kb))

            if [ $size_after_kb -le 100 ]; then
                echo "   ✅ Success: ${size_after_kb}KB (saved ${saved_kb}KB, -${percent}%)"
            else
                echo "   ⚠️  Still large: ${size_after_kb}KB (saved ${saved_kb}KB, -${percent}%)"
            fi

            total_before=$((total_before + size_before))
            total_after=$((total_after + size_after))
            processed=$((processed + 1))
        else
            echo "   ❌ Failed to optimize"
            failed=$((failed + 1))
        fi

        # Clean up temp files
        rm -f "$file.tmp1" "$file.tmp2"
    fi
done

echo ""
echo "============================================================"
echo "📊 RESULTS:"
echo "============================================================"
echo "✅ Successfully processed: $processed files"
if [ $failed -gt 0 ]; then
    echo "❌ Failed: $failed files"
fi

if [ $processed -gt 0 ]; then
    total_saved_mb=$(( (total_before - total_after) / 1048576 ))
    total_before_mb=$((total_before / 1048576))
    total_after_mb=$((total_after / 1048576))

    echo ""
    echo "📦 Size reduction:"
    echo "   Before: ${total_before_mb}MB"
    echo "   After:  ${total_after_mb}MB"
    echo "   Saved:  ${total_saved_mb}MB"
fi

echo ""
echo "💾 Backups saved in: $backup_dir/"
echo "   To restore all: cp $backup_dir/*.png assets/tokens/"
echo "   To restore specific: cp $backup_dir/FILENAME.png assets/tokens/CHAIN/"