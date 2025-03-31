import { DataTypes, Model, Sequelize } from 'sequelize';
import { DB } from "@app/database";
import { UserAttributes } from '@app/types';

class Users extends Model<UserAttributes> {
  public static initialize(sequelize: Sequelize) {
    Users.init(
      {
        id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          }
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        },

      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
      }
    );
  }
}

Users.initialize(DB.getInstance());

export { Users };