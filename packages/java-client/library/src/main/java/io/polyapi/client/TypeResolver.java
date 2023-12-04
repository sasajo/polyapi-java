package io.polyapi.client;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.expr.ArrayCreationExpr;
import com.github.javaparser.ast.expr.ObjectCreationExpr;
import com.github.javaparser.ast.expr.VariableDeclarationExpr;
import com.github.javaparser.ast.type.Type;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.symbolsolver.javaparsermodel.declarations.JavaParserClassDeclaration;

import java.util.function.Predicate;
import java.util.stream.Stream;

public class TypeResolver extends VoidVisitorAdapter<CompilationUnit> {

  private final CompilationUnit compilationUnit;
  private final JavaParser parser;

  public TypeResolver(CompilationUnit compilationUnit, JavaParser parser) {
    this.compilationUnit = compilationUnit;
    this.parser = parser;
  }

  @Override
  public void visit(VariableDeclarationExpr expr, CompilationUnit generatedCode) {
    super.visit(expr, generatedCode);
    expr.getVariables().forEach(variableDeclarator -> resolveType(variableDeclarator.getType(), generatedCode));
  }

  @Override
  public void visit(ObjectCreationExpr expr, CompilationUnit generatedCode) {
    super.visit(expr, generatedCode);
    resolveType(expr.getType(), generatedCode);
  }

  @Override
  public void visit(ArrayCreationExpr expr, CompilationUnit generatedCode) {
    super.visit(expr, generatedCode);
    resolveType(expr.getElementType(), generatedCode);
  }

  @Override
  public void visit(Parameter param, CompilationUnit generatedCode) {
    super.visit(param, generatedCode);
    resolveType(param.getType(), generatedCode);
  }

  private void resolveType(Type type, CompilationUnit generatedCode) {
    if (type.isArrayType()) {
      type = type.getElementType();
    }
    if (!type.isVarType() && !type.isPrimitiveType()) {
      try {
        var resolvedType = type.resolve();
        if (resolvedType.isReferenceType()) {
          var typeDeclaration = resolvedType.asReferenceType().getTypeDeclaration().get();
          if (!Stream.of("java.lang.", "io.polyapi.").anyMatch(typeDeclaration.getQualifiedName()::startsWith)
            && typeDeclaration instanceof JavaParserClassDeclaration) {
            var classCompilationUnit = parser.parse(JavaParserClassDeclaration.class.cast(typeDeclaration).getWrappedNode().getParentNode().get().toString()).getResult().get();
            classCompilationUnit.accept(new TypeResolver(compilationUnit, parser), generatedCode);
            classCompilationUnit.getImports().forEach(generatedCode::addImport);
            var mainClass = generatedCode.getType(0).asClassOrInterfaceDeclaration();
            classCompilationUnit.getTypes().stream()
              .filter(classType -> mainClass.getMembers().stream()
                .noneMatch(member -> member instanceof ClassOrInterfaceDeclaration && ClassOrInterfaceDeclaration.class.cast(member).getNameAsString().equals(classType.getNameAsString())))
              .forEach(mainClass::addMember);
          }
        }
      } catch (IllegalStateException e) {
        // not resolvable type, skipping
      }
    }
  }
}
