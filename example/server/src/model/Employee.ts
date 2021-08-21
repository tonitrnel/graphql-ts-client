/**
 * @author ChenTao
 * 
 * Server-side of example of 'graphql-ts-client'
 */

import 'reflect-metadata';
import { Field, FieldResolver, Float, ObjectType, Resolver, Root } from 'type-graphql';
import { departmentTable } from '../dal/DepartmentRepostiory';
import { employeeTable, TEmployee } from '../dal/EmployeeRepository';
import { Department } from './Department';
import { Gender } from './Gender';
import { Node } from './Node';

@ObjectType({implements: Node})
export class Employee extends Node {

    @Field(() => String)
    readonly firstName: string;

    @Field(() => String)
    readonly lastName: string;

    @Field(() => Gender)
    readonly gender: Gender;

    @Field(() => Float)
    readonly salary: number;

    readonly departmentId: string;
    
    readonly supervisorId?: string;

    constructor(row: TEmployee) {
        super(row.id);
        this.firstName = row.firstName;
        this.lastName = row.lastName;
        this.gender = row.gender;
        this.salary = row.salary;
        this.departmentId = row.departmentId;
        this.supervisorId = row.supervisorId;
    }
}

/*
 * This simple demo uses data in memory to mock database,
 * so there is no performance issues, "N + 1" query is not a problem 
 * 
 * That means "Resvoler" is enough and "DataLoader" optimization is unnecessary.
 */
@Resolver(Employee)
export class EmployeeResolver {

    @FieldResolver(() => Department)
    department(@Root() self: Employee): Department {
        return new Department(departmentTable.findNonNullById(self.departmentId)!);
    }

    @FieldResolver(() => Employee, {nullable: true})
    supervisor(@Root() self: Employee): Employee | undefined {
        if (self.supervisorId === undefined) {
            return undefined;
        }
        return new Employee(employeeTable.findNonNullById(self.supervisorId)!);
    }

    @FieldResolver(() => [Employee])
    subordinates(@Root() self: Employee): Employee[] {
        return employeeTable
            .findByProp("supervisorId", self.id)
            .map(row => new Employee(row));
    }
}