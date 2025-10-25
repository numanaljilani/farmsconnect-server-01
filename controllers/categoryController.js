import Category from '../models/Category.js';
import logger from '../utils/logger.js';

const createCategory = async (req, res) => {
  try {
    const categoriesArray = req.body.categories; // Expecting an array of category objects
    
    // Basic check to ensure the body is an array and not empty
    if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
      return res.status(400).json({ message: 'Request body must be a non-empty array of categories.' });
    }

    const createdCategories = [];
    const failedCreations = [];

    // Use Promise.all to handle parallel asynchronous operations (for better performance)
    const creationPromises = categoriesArray.map(async (categoryData) => {
      const { name, slug, icon, subcategories } = categoryData;

      // Ensure essential fields are present for each category
      if (!name || !slug) {
        failedCreations.push({ categoryData, reason: 'Missing name or slug.' });
        return; // Skip to the next category in the map
      }

      try {
        // 1. Check for existing category by slug
        const existing = await Category.findOne({ slug });
        if (existing) {
          failedCreations.push({ categoryData, reason: `Category with slug "${slug}" already exists.` });
          return;
        }

        // 2. Create and save the new category
        const newCategory = new Category({
          name,
          slug,
          icon: icon || null, // Default icon to null if not provided
          subcategories: subcategories || [],
        });
        
        const savedCategory = await newCategory.save();
        
        logger.info(`Created category: ${slug}`);
        createdCategories.push(savedCategory);

      } catch (error) {
        // Handle database or other individual category creation errors
        logger.error(`Create category error for slug "${slug}": ${error.message}`);
        failedCreations.push({ categoryData, reason: `Database error: ${error.message}` });
      }
    });

    // Wait for all creation attempts to finish
    await Promise.all(creationPromises);

    // 3. Send a consolidated response
    if (createdCategories.length > 0) {
      // If some were created, return a 201 with details of created/failed
      return res.status(201).json({
        message: `${createdCategories.length} categories created successfully.`,
        created: createdCategories,
        failed: failedCreations,
      });
    } else {
      // If none were created (e.g., all were duplicates or had errors)
      return res.status(400).json({
        message: 'No categories were created.',
        failed: failedCreations,
      });
    }

  } catch (error) {
    // This catch block handles errors *outside* the array iteration (e.g., initial DB connection issues)
    logger.error(`Batch create categories error: ${error.message}`);
    res.status(500).json({ message: 'Server error during batch processing.' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    logger.error(`Get categories error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, subcategories } = req.body;
    const existing = await Category.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: `Category with slug ${slug} already exists` });
    }
    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug, icon, subcategories },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    logger.info(`Updated category: ${id}`);
    res.status(200).json(category);
  } catch (error) {
    logger.error(`Update category error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    logger.info(`Deleted category: ${id}`);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error(`Delete category error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export { createCategory, getCategories, updateCategory, deleteCategory };