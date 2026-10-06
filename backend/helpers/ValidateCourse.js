function validateCourse(input = {}) {

  const errors = {};

  // ======================================================
  // TRIM STRING VALUES
  // ======================================================

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


  // ======================================================
  // MAXIMUM STUDENTS
  // ======================================================

  const maxStudentsInput = input.max_students;

  let max_students = null;

  if (
    maxStudentsInput !== undefined &&
    maxStudentsInput !== null &&
    String(maxStudentsInput).trim() !== ""
  ) {

    const maxStudentsString =
      String(maxStudentsInput).trim();

    // Positive integer only
    if (!/^[1-9]\d*$/.test(maxStudentsString)) {

      errors.max_students =
        "Maximum Students must be a positive integer";

    } else {

      const numericMaxStudents =
        Number(maxStudentsString);

      if (!Number.isSafeInteger(numericMaxStudents)) {

        errors.max_students =
          "Maximum Students value is too large";

      } else {

        max_students = numericMaxStudents;
      }
    }
  }


  // ======================================================
  // TITLE
  // ======================================================

  if (!title) {

    errors.title = "Title is required";

  } else if (title.length < 3) {

    errors.title =
      "Title must contain at least 3 characters";

  } else if (title.length > 100) {

    errors.title =
      "Title must not exceed 100 characters";
  }


  // ======================================================
  // CATEGORY
  // ======================================================

  if (!category) {

    errors.category = "Category is required";

  } else if (category.length < 2) {

    errors.category =
      "Category must contain at least 2 characters";

  } else if (category.length > 50) {

    errors.category =
      "Category must not exceed 50 characters";
  }


  // ======================================================
  // LEVEL
  // ======================================================

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


  // ======================================================
  // DURATION
  // ======================================================

  const durationPattern =
    /^[1-9]\d* (Days|Weeks|Months)$/;

  if (!duration) {

    errors.duration = "Duration is required";

  } else if (!durationPattern.test(duration)) {

    errors.duration =
      "Duration must be a positive integer followed by Days, Weeks, or Months";
  }


  // ======================================================
  // PRICE
  // ======================================================

  const price = input.price;

  if (
    price === undefined ||
    price === null ||
    String(price).trim() === ""
  ) {

    errors.price = "Price is required";

  } else {

    const priceString =
      String(price).trim();

    if (!/^\d+(\.\d+)?$/.test(priceString)) {

      errors.price = "Price must be numeric";

    } else {

      const numericPrice =
        Number(priceString);

      if (numericPrice < 0) {

        errors.price =
          "Price cannot be negative";

      } else if (numericPrice > 1000000) {

        errors.price =
          "Price cannot exceed 1,000,000";

      } else if (
        priceString.includes(".") &&
        priceString.split(".")[1].length > 2
      ) {

        errors.price =
          "Price must contain no more than two decimal places";
      }
    }
  }


  // ======================================================
  // IMAGE
  // ======================================================

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


  // ======================================================
  // DESCRIPTION
  // ======================================================

  if (description.length > 1000) {

    errors.description =
      "Description must not exceed 1,000 characters";
  }


  // ======================================================
  // CLEAN DATA
  // ======================================================

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

    image:
      image || null,

    description:
      description || null,

    max_students,
  };


  return {

    isValid:
      Object.keys(errors).length === 0,

    errors,

    data: cleanedData,
  };
}


module.exports = validateCourse;function validateCourse(input = {}) {

  const errors = {};

  // ======================================================
  // TRIM STRING VALUES
  // ======================================================

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


  // ======================================================
  // MAXIMUM STUDENTS
  // ======================================================

  const maxStudentsInput = input.max_students;

  let max_students = null;

  if (
    maxStudentsInput !== undefined &&
    maxStudentsInput !== null &&
    String(maxStudentsInput).trim() !== ""
  ) {

    const maxStudentsString =
      String(maxStudentsInput).trim();

    // Positive integer only
    if (!/^[1-9]\d*$/.test(maxStudentsString)) {

      errors.max_students =
        "Maximum Students must be a positive integer";

    } else {

      const numericMaxStudents =
        Number(maxStudentsString);

      if (!Number.isSafeInteger(numericMaxStudents)) {

        errors.max_students =
          "Maximum Students value is too large";

      } else {

        max_students = numericMaxStudents;
      }
    }
  }


  // ======================================================
  // TITLE
  // ======================================================

  if (!title) {

    errors.title = "Title is required";

  } else if (title.length < 3) {

    errors.title =
      "Title must contain at least 3 characters";

  } else if (title.length > 100) {

    errors.title =
      "Title must not exceed 100 characters";
  }


  // ======================================================
  // CATEGORY
  // ======================================================

  if (!category) {

    errors.category = "Category is required";

  } else if (category.length < 2) {

    errors.category =
      "Category must contain at least 2 characters";

  } else if (category.length > 50) {

    errors.category =
      "Category must not exceed 50 characters";
  }


  // ======================================================
  // LEVEL
  // ======================================================

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


  // ======================================================
  // DURATION
  // ======================================================

  const durationPattern =
    /^[1-9]\d* (Days|Weeks|Months)$/;

  if (!duration) {

    errors.duration = "Duration is required";

  } else if (!durationPattern.test(duration)) {

    errors.duration =
      "Duration must be a positive integer followed by Days, Weeks, or Months";
  }


  // ======================================================
  // PRICE
  // ======================================================

  const price = input.price;

  if (
    price === undefined ||
    price === null ||
    String(price).trim() === ""
  ) {

    errors.price = "Price is required";

  } else {

    const priceString =
      String(price).trim();

    if (!/^\d+(\.\d+)?$/.test(priceString)) {

      errors.price = "Price must be numeric";

    } else {

      const numericPrice =
        Number(priceString);

      if (numericPrice < 0) {

        errors.price =
          "Price cannot be negative";

      } else if (numericPrice > 1000000) {

        errors.price =
          "Price cannot exceed 1,000,000";

      } else if (
        priceString.includes(".") &&
        priceString.split(".")[1].length > 2
      ) {

        errors.price =
          "Price must contain no more than two decimal places";
      }
    }
  }


  // ======================================================
  // IMAGE
  // ======================================================

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


  // ======================================================
  // DESCRIPTION
  // ======================================================

  if (description.length > 1000) {

    errors.description =
      "Description must not exceed 1,000 characters";
  }


  // ======================================================
  // CLEAN DATA
  // ======================================================

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

    image:
      image || null,

    description:
      description || null,

    max_students,
  };


  return {

    isValid:
      Object.keys(errors).length === 0,

    errors,

    data: cleanedData,
  };
}


module.exports = validateCourse;