#!/bin/bash
SCRIPT_PATH="${BASH_SOURCE[0]}";
if ([ -h "${SCRIPT_PATH}" ]) then
  while([ -h "${SCRIPT_PATH}" ]) do SCRIPT_PATH=`readlink "${SCRIPT_PATH}"`; done
fi
pushd . > /dev/null
cd `dirname ${SCRIPT_PATH}` > /dev/null
cd ../../

# Building plugin distributive
rm plugin.webinterface.ktalk*.zip 2> /dev/null
rm webinterface.ktalk/plugin.webinterface.ktalk*.zip 2> /dev/null
zip -r plugin.webinterface.ktalk.zip webinterface.ktalk/* -x "*/.*" "*/*.app/*" "*/*.zip" "*/README.*" "*/LICENSE" "*/screenshot*.*" "*/*.sublime*" "*/test/*" "*/*.map" "*/js/framework7.js*"
ADDON_VER=`cat webinterface.ktalk/addon.xml | grep "^<addon\s.*\sversion=" | grep -o "[0-9][0-9\.]\+"`
mv plugin.webinterface.ktalk.zip webinterface.ktalk/plugin.webinterface.ktalk-${ADDON_VER}.zip

# Update repository addon data
ADDON_DIR=repository.eip/addons/plugin.webinterface.ktalk
rm -Rf ${ADDON_DIR}
mkdir ${ADDON_DIR}
cp webinterface.ktalk/addon.xml ${ADDON_DIR}
cp webinterface.ktalk/changelog.txt ${ADDON_DIR}
cp webinterface.ktalk/icon.png ${ADDON_DIR}
cp webinterface.ktalk/plugin.webinterface.ktalk-${ADDON_VER}.zip ${ADDON_DIR}

# Update repository info (addons.xml)
rm repository.eip/addons/addons.xml 2> /dev/null
echo "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" > repository.eip/addons/addons-tmp.xml
echo "<addons>" >> repository.eip/addons/addons-tmp.xml
find repository.eip/addons -name addon.xml | sort | while read f;
do
  cat "$f" | grep --invert-match "^<?xml" >> repository.eip/addons/addons-tmp.xml
done;
echo "</addons>" >> repository.eip/addons/addons-tmp.xml
xmllint --format --encode UTF-8 repository.eip/addons/addons-tmp.xml > repository.eip/addons/addons.xml
rm repository.eip/addons/addons-tmp.xml 2> /dev/null
md5 -q repository.eip/addons/addons.xml > repository.eip/addons/addons.xml.md5

popd > /dev/null
