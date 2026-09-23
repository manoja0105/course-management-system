
function validateCourse(input = {}) {
  const errors = {};

  // ---------- Trim string values ----------
  const title =
    typeof input.title === "string"
      ? input.title.trim()
      : "";

  const category =
    typeof input.category === "string"
      ? input.category.trim()
      : "";

  const level =
    typeof input.level === "string"
      ? input.level.trim()
      : "";

  const duration =
    typeof input.duration === "string"
      ? input.duration.trim()
      : "";

  const image =
    typeof input.image === "string"
      ? input.image.trim()
      : "";

  const description =
    typeof input.description === "string"
      ? input.description.trim()
      : "";

  // ---------- Title ----------
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must contain at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title must not exceed 100 characters";
  }

  // ---------- Category ----------
  if (!category) {
    errors.category = "Category is required";
  } else if (category.length < 2) {
    errors.category =
      "Category must contain at least 2 characters";
  } else if (category.length > 50) {
    errors.category =
      "Category must not exceed 50 characters";
  }

  // ---------- Level ----------
  const validLevels = [
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  if (!level) {
    errors.level = "Level is required";
  } else if (!validLevels.includes(level)) {
    errors.level =
      "Level must be Beginner, Intermediate, or Advanced";
  }

  // ---------- Duration ----------
  const durationPattern =
    /^[1-9]\d* (Days|Weeks|Months)$/;

  if (!duration) {
    errors.duration = "Duration is required";
  } else if (!durationPattern.test(duration)) {
    errors.duration =
      "Duration must be a positive integer followed by Days, Weeks, or Months";
  }

  // ---------- Price ----------
  const price = input.price;

  if (
    price === undefined ||
    price === null ||
    String(price).trim() === ""
  ) {
    errors.price = "Price is required";
  } else {
    const priceString = String(price).trim();

    // Must contain only a valid non-negative number
    if (!/^\d+(\.\d+)?$/.test(priceString)) {
      errors.price = "Price must be numeric";
    } else {
      const numericPrice = Number(priceString);

      if (numericPrice < 0) {
        errors.price = "Price cannot be negative";
      } else if (numericPrice > 1000000) {
        errors.price = "Price cannot exceed 1,000,000";
      } else if (
        priceString.includes(".") &&
        priceString.split(".")[1].length > 2
      ) {
        errors.price =
          "Price must contain no more than two decimal places";
      }
    }
  }

  // ---------- Image ----------
  if (image) {
    if (image.length > 500) {
      errors.image =
        "Image URL must not exceed 500 characters";
    } else {
      try {
        const imageUrl = new URL(image);

        if (
          imageUrl.protocol !== "http:" &&
          imageUrl.protocol !== "https:"
        ) {
          errors.image =
            "Image must be a valid HTTP or HTTPS URL";
        }
      } catch {
        errors.image =
          "Image must be a valid HTTP or HTTPS URL";
      }
    }
  }

  // ---------- Description ----------
  if (description.length > 1000) {
    errors.description =
      "Description must not exceed 1,000 characters";
  }

  // ---------- Prepare cleaned data ----------
  const cleanedData = {
    title,
    category,
    level,
    duration,
    price:
      price === undefined ||
      price === null ||
      String(price).trim() === ""
        ? null
        : Number(String(price).trim()),
    image: image || null,
    description: description || null,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: cleanedData,
  };
}

module.exports = validateCourse;

