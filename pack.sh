#! /bin/bash

echo "clean ./pack/"
rm -rf pack/ || true
mkdir pack/

echo "creating zip"
zip -r pack/malBlock.zip malBlock/ -x "*.pem" ".DS_Store"

echo "packing extension"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=malBlock --pack-extension-key=data/key.pem
mv malBlock.crx pack/malBlock.crx

echo "done"
ls ./pack/
