#!/bin/bash
SCRIPT_PATH="${BASH_SOURCE[0]}";
if ([ -h "${SCRIPT_PATH}" ]) then
  while([ -h "${SCRIPT_PATH}" ]) do SCRIPT_PATH=`readlink "${SCRIPT_PATH}"`; done
fi
pushd . > /dev/null
cd `dirname ${SCRIPT_PATH}` > /dev/null
cd ../../
rm webinterface.ktalk*.zip 2> /dev/null
rm webinterface.ktalk/webinterface.ktalk*.zip 2> /dev/null
zip -r webinterface.ktalk.zip webinterface.ktalk/* -x "*/.*" "*/*.app/*" "*/*.zip" "*/README.*" "*/LICENSE" "*/screenshot.*" "*/test/*" "*/*.map" "*/js/framework7.js*"
ADDON_VER=`cat webinterface.ktalk/addon.xml | grep "^\s*version=" | grep -o "[0-9\.]\+"`
mv webinterface.ktalk.zip webinterface.ktalk/webinterface.ktalk-${ADDON_VER}.zip
popd > /dev/null
