import { DataTypes, Model, Sequelize } from 'sequelize';
import { DB } from "@app/database";
import { IUserAttributes } from '@app/interfaces';

class Users extends Model<IUserAttributes> {

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
        picture: {
          type: DataTypes.STRING,
          allowNull: true
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