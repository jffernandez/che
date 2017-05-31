#
# Copyright (c) 2012-2017 Codenvy, S.A.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html
#
# Contributors:
#   Codenvy, S.A. - initial API and implementation
#

script="/home/user/.ssh/git.sh"

token=$(if [ "$USER_TOKEN" != "dummy_token" ]; then echo "$USER_TOKEN"; fi)
che_host=$(cat /etc/hosts | grep che-host | awk '{print $1;}')
api_url=$(if [ "$CHE_API" != "http://che-host:8080/wsmaster/api" ]; then echo "$CHE_API"; else echo "$che_host:8080/api"; fi)

CURL_INSTALLED=false
WGET_INSTALLED=false
command -v curl >/dev/null 2>&1 && CURL_INSTALLED=true
command -v wget >/dev/null 2>&1 && WGET_INSTALLED=true

# no curl, no wget, install curl
if [ ${CURL_INSTALLED} = false ] && [ ${WGET_INSTALLED} = false ]; then
  PACKAGES=${PACKAGES}" curl";
  CURL_INSTALLED=true
fi

echo 'host=$(echo $(if [ "$1" = "-p" ]; then echo "$3" ; else echo "$1"; fi) | sed -e "s/git@//")' > $script
echo 'token='$token >> $script
echo 'api_url='$api_url >> $script
echo 'ssh_key=$(curl -s "$api_url/ssh/vcs/find?name=$host$(if [ -n "$token" ]; then echo "&token=$token"; fi)"| grep -Po '\''"privateKey":.*?[^\\\\]",'\''| sed -e "s/\"privateKey\":\"//" | sed -e "s/\\\\\u003d/=/")' >> $script
echo 'if [ -n "$ssh_key" ]' >> $script
echo 'then' >> $script
echo '    key_file=$(mktemp)' >> $script
echo '    echo "$ssh_key" > "$key_file"' >> $script
echo '    ssh -i "$key_file" "$@"' >> $script
echo '    rm "$key_file"' >> $script
echo 'else' >> $script
echo '    ssh "$@"' >> $script
echo 'fi' >> $script

chmod +x $script

user_name="$(curl -s "$api_url/preferences$(if [ -n "$token" ]; then echo "?token=$token"; fi)" | grep -Po '"git.committer.name":.*?[^\\]",' | sed -e "s/\"git.committer.name\":\"//" | sed -e "s/\",//")"
user_email="$(curl -s "$api_url/preferences$(if [ -n "$token" ]; then echo "?token=$token"; fi)" | grep -Po '"git.committer.email":.*?[^\\]",' | sed -e "s/\"git.committer.email\":\"//" | sed -e "s/\",//")"
git config --global user.name \""$user_name"\"
git config --global user.email \""$user_email"\"

if [ -z "$(cat /home/user/.bashrc | grep GIT_SSH)" ]
then
    printf '\n export GIT_SSH='$script >> /home/user/.bashrc
fi
