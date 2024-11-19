#!/bin/bash

remove_target_folder() {
    if [ -z "$1" ]; then
      echo "Usage: $0 <target_folder_name>"
      exit 1
    fi

    TARGET_FOLDER="$1"

    # Start from the root directory
    ROOT_DIR=$(pwd)

    # Delete the target folder in the root directory if it exists
    if [ -d "$ROOT_DIR/$TARGET_FOLDER" ]; then
      echo "Deleting $ROOT_DIR/$TARGET_FOLDER"
      rm -rf "$ROOT_DIR/$TARGET_FOLDER/target"
    else
      echo "No $TARGET_FOLDER found in root directory."
    fi

    # Find and delete the target folder in first-level subdirectories
    for dir in "$ROOT_DIR"/*/; do
      if [ -d "$dir$TARGET_FOLDER" ]; then
        echo "Deleting $dir$TARGET_FOLDER"
        rm -rf "$dir$TARGET_FOLDER/target"
      fi
    done

    echo "Cleanup completed."
}

remove_target_folder commons
remove_target_folder library
remove_target_folder polyapi-maven-plugin
remove_target_folder demo-app