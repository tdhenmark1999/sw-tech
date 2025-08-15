#Step 1: Build the Angular app
FROM node:22 AS build

# Set working directory inside container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install

# Now copy the rest of the app source code
COPY . .

# Build the Angular app for production
RUN pnpm run build --configuration production

# Check if dist folder exists after build
RUN ls -l /app/dist

# Step 2: Serve the build using a lightweight web server (nginx)
FROM nginx:stable-alpine

# Copy the Angular build files to nginx's default html folder
COPY --from=build /app/dist/swisspine-tech-test-exam /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]