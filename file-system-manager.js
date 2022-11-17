/*
ls - [./] [../] [DIR]; List information about the FILEs (the current directory by default).
rm - [FILE]; Removes specified file.
cd - [./] [../] [DIRECTORY]; Change the working directory of the current shell execution environment.
pwd - Print the name of current working directory.
cat - [FILE]; Concatenate FILE(s) to standard output.
help - [COMMAND]; Print the help of a command.
mkdir - [DIRECTORY]; Create the DIRECTORY, if it does not already exist.
rmdir - [DIRECTORY]; Remove the DIRECTORY, if it is empty.
touch - [FILE]; A FILE argument that does not exist is created empty.
 */




class FileSystemManager{
    constructor(filesystem){
        this.filesystem = filesystem
    }
    
    ls(path, args=[]){
        const contents = this.filesystem.ls(path)
        return 
    }

    cd(path, args=[]){
        return this.filesystem.cd(path)
    }

    pwd(args=[]){
        return this.filesystem.pwd()
    }

    cat(path, args=[]){
        return this.filesystem.cat(path)
    }

    help(cmd, args=[]){
        //Display general help message or help about a command
    }

    mkdir(path, args=[]){
        return this.filesystem.mkdir(path)
    }

    touch(path, args=[]){
        return this.filesystem.touch(path)
    }

    rmdir(path, args=[]){
        return this.filesystem.rmdir(path)
    }

    rm(path, args=[]){
        return this.filesystem.rm(path)
    }
    
}