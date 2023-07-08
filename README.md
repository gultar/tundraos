# Tundra OS ❄️🖥️

An electron-powered desktop environment designed to provide a seamless user experience.

## Requirements 🛠️

To use Tundra OS, ensure that you have Node.js and NPM (Node Package Manager) installed. It is recommended to use a Linux system or Windows Subsystem for Linux, although the environment is also compatible with Windows, with some potential limitations.

To install Node.js, run the following commands:

```
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
```

Then, install the Node.js package by running:

```
sudo apt-get install -y nodejs
```

Alternatively, you can visit the [Node.js website](https://nodejs.org/en/) and follow the provided steps.

## Installation 🚀

To get started with Tundra OS, follow these steps:

1. Clone the repository by running the command:

   ```
   git clone https://github.com/gultar/workspace
   ```

2. Install all the necessary dependencies by running:

   ```
   npm install
   ```

## Running 🏃

If you are using Tundra OS on Windows, it is recommended to enter the Windows Subsystem for Linux (WSL) since the project was primarily built with Linux in mind.

To launch the application with a built-in filesystem at the root of the project's directory, run the following command:

```
npm run electron
```

Alternatively, if you wish to have access to the entire Linux filesystem, use the following command:

```
npm run electron-full
```

## API 📚

Tundra OS provides the following API tools:

- **ApplicationWindow**: An ApplicationWindow instance serves as a wrapper for the WinBox library, enabling the creation of flexible, elegant, and customizable windows. It allows for saving and loading window states, making it convenient for developers to reload changes made to the front-end of their applications without reopening them.

- **Editor**: The Editor tool launches a cool and simple code editor powered by Ace, with file management capabilities. Initialize it with the desired path to a file.

- **Exec Command and Directory Pointers**: To interact with the virtual filesystem, use unique directory pointer IDs and include them in filesystem commands. Directory "pointers" reference directories through circular references to their parent directory. Creating a wrapping function can help simplify the process. Don't forget to destroy the pointer when you're finished.

## Built by ✨

Sacha-Olivier Dulac

Enjoy using Tundra OS and explore the seamless electron-powered desktop environment it offers! ❄️🖥️