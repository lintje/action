module.exports = {
  "src/**/*.js": (files) => {
    return [`eslint --fix ${files.join(" ")}`, "npm run build"];
  }
};
