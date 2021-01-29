
### Packaging app on linux

<details><summary><b>Show instructions</b></summary>

This part goal is to package a actual version of autonoMe or older and then package it into a .deb package. 

1. First, install globaly on debian based distro the packager  `electron-installer-debian`:

    ```sh
    $ sudo npm install -g electron-installer-debian
    ```

2. Execute the `package-linux` from the script section of `package.json`:

    ```sh
    $ npm run package-linux
    ```

3. Package the linux folders to .deb:

    ```sh
    $ electron-installer-debian --src release-builds/AutonoME-linux-x64/ --arch amd64 --config linux/debian.json
    ```

4. <strong>/!\ INSTALLATION PART /!\ $apt update is heavily recommanded before any use.</strong>

5. Get latest version of AutonoMe, zip or installer.deb. Make sure it's in Documents folder.

6. Install Node latest version with NVM ! Way easier with NVM method.

7. Unzip, the software is now installed, but you will lack most of the dependencies. Stay in ~/Documents/autonome_dev folder.

    ```sh
    $ npm i
    ```

    it will install all the missing dependencies all mandatory to run the software properly.

8. Almost done with installation. At this point, we can check if all is ok by typing :

    ```sh
    $ npm t
    ```
    if it launches correctly you can skip 8. ERR) section.

8. ERR ) At first, be sure to reload multiple times the app, maybe it's taking time to fetch the assets.
         If you still miss assets or any CSS element, it means you have to download on libnet filemanager the resources package and unzip it in autonome_dev/resources.
         cut the soft and restart then.

9. Now we want autonoMe to start itself at each boot on the device. First :
    ```sh
    $ cd  ~/etc/init.d/ 
    $ touch bootnedap.sh
    $ sudo vim bootnedap.sh // ( "npm i vim" if not installed, sudo is mandatory )
     Copy/Paste this into it //  $ cd ~/Documents/[autonome_dev_name_folder] && yes | npm test ( press Ctrl+C to initiate command prompt and type ":wq" to save your edit. )
     Now exec this cmd // $ sudo update-rc.d /etc/init.d/bootnedap.sh defaults // ( to initialize the script in boot sequence. If you are already in the right folder you can do
    $ sudo update-rc.d ./bootnedap.sh defaults )
     and finally give it superuser permissions // $ sudo chmod +x /etc/init.d/bootnedap.sh
    ```

10. AutonoME is now full operational and will autostart at each boot. We can now edit anything by TeamViewer + Libnet config. ( Hotfix, Updates, CSS editing... )

11. To connect all devices make sure they are on a USB port then install all mising pip-modules. [ Unidecode, python-escpos ... (use $pip install [module_name]) ]

12. If superuser problem chmod 777 -R /home

</details>


