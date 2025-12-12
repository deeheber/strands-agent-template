#!/bin/bash

# Python Quality Check Script
# Run from the agent directory

echo "🔍 Starting Python quality checks..."

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Not in agent directory. Please run from agent/ folder."
    exit 1
fi

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "⚠️  Warning: No virtual environment found at .venv"
fi

# Run quality checks
echo "🧪 Running tests..."
if pytest; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi

echo "🔍 Running type checking..."
if mypy src/; then
    echo "✅ Type checking passed"
else
    echo "❌ Type checking failed"
    exit 1
fi

echo "🔧 Running linting..."
if ruff check .; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi

echo "🎨 Checking code formatting..."
if black --check .; then
    echo "✅ Code formatting verified"
else
    echo "❌ Code formatting issues found"
    echo "💡 Run 'black .' to fix formatting"
    exit 1
fi

echo "🎉 All quality checks passed!"