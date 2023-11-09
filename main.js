const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;
let aboutWindow;

// Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 1000 : 500,
    height: 900,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // // Show devtools automatically if in development
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  // mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// About Window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: 'About Electron',
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// When the app is ready, create the window
app.on('ready', () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove variable from memory
  mainWindow.on('closed', () => (mainWindow = null));
});

// Menu template
const menu = [
  ...(isMac
    ? [
      {
        label: app.name,
        submenu: [
          {
            label: 'About',
            click: createAboutWindow,
          },
        ],
      },
    ]
    : []),
  {
    role: 'fileMenu',
  },
  ...(!isMac
    ? [
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: createAboutWindow,
          },
        ],
      },
    ]
    : []),
  ...(isDev
    ? [
      {
        label: 'Developer',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { type: 'separator' },
          { role: 'toggledevtools' },
        ],
      },
    ]
    : []),
];

ipcMain.on('image:resize', async (e, options) => {
  const dest = path.join(os.homedir(), 'imageresizer');
  const selectedItems = options?.selectedOptions;
  const imgPath = options?.imgPath;

  for (const item of selectedItems) {
    const { height, width, fileName } = getDimensionsForItem(item);

    if (imgPath && height && width && fileName) {
      const options = { imgPath, height, width, dest: path.join(dest, item) };
      try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
          width: +width,
          height: +height,
        });
        if (!fs.existsSync(options.dest)) {
          fs.mkdirSync(options.dest, { recursive: true });
        }
        fs.writeFileSync(path.join(options.dest, fileName + '.png'), newPath);

        mainWindow.webContents.send('image:done', { item });
      } catch (err) {
        console.error('Resizing error:', err);
      }
    }
  }
  shell.openPath(options.dest);
});

function getDimensionsForItem(item) {
  switch (item) {

    case 'mdpi-normal':
      return { imgPath: 'mipmap-mdpi', height: 48, width: 48, fileName: 'ic_launcher' };
    case 'mdpi-rounded':
      return { imgPath: 'mipmap-mdpi', height: 48, width: 48, fileName: 'ic_launcher_round' };
    case 'hdpi-normal':
      return { imgPath: 'mipmap-hdpi', height: 72, width: 72, fileName: 'ic_launcher' };
    case 'hdpi-rounded':
      return { imgPath: 'mipmap-hdpi', height: 72, width: 72, fileName: 'ic_launcher_round' };
    case 'xhdpi-normal':
      return { imgPath: 'mipmap-xhdpi', height: 96, width: 96, fileName: 'ic_launcher' };
    case 'xhdpi-rounded':
      return { imgPath: 'mipmap-xhdpi', height: 96, width: 96, fileName: 'ic_launcher_round' };
    case 'xxhdpi-normal':
      return { imgPath: 'mipmap-xxhdpi', height: 144, width: 144, fileName: 'ic_launcher' };
    case 'xxhdpi-rounded':
      return { imgPath: 'mipmap-xxhdpi', height: 144, width: 144, fileName: 'ic_launcher_round' };
    case 'xxxhdpi-normal':
      return { imgPath: 'mipmap-xxxhdpi', height: 192, width: 192, fileName: 'ic_launcher' };
    case 'xxxhdpi-rounded':
      return { imgPath: 'mipmap-xxxhdpi', height: 192, width: 192, fileName: 'ic_launcher_round' };
    case 'appstore-icon':
      return { imgPath: 'appstore-icon', height: 1024, width: 1024, fileName: 'appstore-icon' };
    case 'app-icon':
      return { imgPath: 'app-icon', height: 180, width: 180, fileName: 'app-icon' };
    default:
      return {};
  }
}

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
