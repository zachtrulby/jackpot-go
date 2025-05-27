# Getting Started with `jackpot-go`

Follow these steps to set up and run the project locally or in your CI/CD pipeline.

## 1. Clone the Repository

```sh
git clone https://github.com/zachtrulby/jackpot-go.git
cd jackpot-go
```

## 2. Set Up Environment Variables

Create a `.env` file in the project root. Copy the contents from `.env.example` if available:

```sh
cp .env.example .env
```

Edit `.env` to set the required environment variables for your environment.

## 3. Build the Project (Staging)

To build the project for staging, use the provided script:

```sh
cd staging
./src.sh
```

This script will handle the build process as configured for the staging environment.

## 4. Running in a Pipeline

Ensure your pipeline loads environment variables from `.env` before running the build script. For example, in a shell step:

```sh
export $(grep -v '^#' .env | xargs)
cd staging
./src.sh
```

## 5. Additional Notes

- Make sure all dependencies are installed as required by the project.
- Refer to project-specific documentation for further configuration or deployment steps.
